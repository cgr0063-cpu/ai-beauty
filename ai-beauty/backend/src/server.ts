import express from "express";
import cors from "cors";
import multer from "multer";
import "dotenv/config";
import { generateLook, regenerateLook, analyzeFitCheck, analyzeClosetItem, isAIConfigured } from "./ai.js";
import { authRouter, verifyToken } from "./auth.js";
import { closeDb, getDb } from "./db.js";
import { rateLimit, securityHeaders } from "./security.js";
import { fetchWeeklyTrends } from "./trends.js";
import { errorHandler, logError, logEvent, notFoundHandler, requestTelemetry } from "./observability.js";
import { closetAnalyzeFieldsSchema, fitCheckFieldsSchema, lookRequestSchema, regenerateDirectionSchema } from "./validation.js";

const app = express();
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true";
const DISABLE_AI = process.env.DISABLE_AI === "true";
const DISABLE_TRENDS = process.env.DISABLE_TRENDS === "true";
const RELEASE_ID = (process.env.RELEASE_ID || "unknown").trim().slice(0, 120);
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(requestTelemetry);
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",").map((x) => x.trim()).filter(Boolean);
app.use(cors({ origin(origin, cb) {
  if (!origin || process.env.NODE_ENV !== "production" || allowedOrigins.includes(origin)) return cb(null, true);
  cb(new Error("cors_origin_denied"));
}}));
app.use(express.json({ limit: "2mb" }));
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED_IMAGE_TYPES.has(file.mimetype)),
});

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ error: "unauthorized" });
  res.locals.userId = payload.sub;
  next();
}

export async function requirePlus(_req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const db = await getDb();
    const row = await db.get<{ plan?: string }>("SELECT plan FROM entitlements WHERE user_id = ?", res.locals.userId);
    if (row?.plan !== "plus") return res.status(403).json({ error: "plus_required" });
    next();
  } catch (error) {
    logError("entitlement_check_failed", error, { requestId: res.locals.requestId, userId: res.locals.userId });
    return res.status(503).json({ error: "entitlement_unavailable" });
  }
}

function parseJsonField(value: unknown) {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return Symbol.for("invalid_json"); }
}

app.use("/v1/auth", authRouter);

const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET?.trim();
const ACTIVE_REVENUECAT_EVENTS = new Set([
  "INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "PRODUCT_CHANGE", "NON_RENEWING_PURCHASE", "SUBSCRIPTION_EXTENDED",
]);
const INACTIVE_REVENUECAT_EVENTS = new Set(["EXPIRATION"]);

app.post("/v1/webhooks/revenuecat", express.json({ limit: "256kb" }), async (req, res) => {
  if (!REVENUECAT_WEBHOOK_SECRET) return res.status(503).json({ error: "webhook_not_configured" });
  const authHeader = req.headers.authorization ?? "";
  if (authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) return res.status(401).json({ error: "unauthorized" });

  const event = req.body?.event;
  const eventId = typeof event?.id === "string" ? event.id.trim() : "";
  const userId = typeof event?.app_user_id === "string" ? event.app_user_id.trim() : "";
  const type = typeof event?.type === "string" ? event.type : "";
  const eventAt = Number(event?.event_timestamp_ms);
  const entitlementIds = Array.isArray(event?.entitlement_ids) ? event.entitlement_ids.filter((x: unknown) => typeof x === "string") : [];
  if (!eventId || !userId || !type || !Number.isFinite(eventAt) || eventAt <= 0) {
    return res.status(400).json({ error: "invalid_webhook" });
  }

  // Only the configured RevenueCat entitlement named `plus` can grant Plus.
  // CANCELLATION alone does not revoke access immediately; RevenueCat access
  // normally remains valid until the EXPIRATION event arrives.
  let plan: "free" | "plus" | null = null;
  if (ACTIVE_REVENUECAT_EVENTS.has(type) && entitlementIds.includes("plus")) plan = "plus";
  else if (INACTIVE_REVENUECAT_EVENTS.has(type) && entitlementIds.includes("plus")) plan = "free";

  const db = await getDb();
  const user = await db.get("SELECT id FROM users WHERE id = ?", userId);
  if (!user) return res.status(202).json({ ok: true, ignored: "unknown_user" });

  try {
    const result = await db.transaction(async (tx) => {
      const duplicate = await tx.get("SELECT event_id FROM revenuecat_events WHERE event_id = ?", eventId);
      if (duplicate) return { duplicate: true };

      await tx.run(
        "INSERT INTO revenuecat_events (event_id, user_id, event_type, event_at, received_at) VALUES (?, ?, ?, ?, ?)",
        eventId, userId, type, eventAt, Date.now()
      );

      if (plan) {
        const current = await tx.get("SELECT provider_event_at FROM entitlements WHERE user_id = ?", userId);
        const lastEventAt = Number(current?.provider_event_at ?? 0);
        if (eventAt >= lastEventAt) {
          await tx.run(
            "INSERT INTO entitlements (user_id, plan, updated_at, provider_event_at) VALUES (?, ?, ?, ?) " +
            "ON CONFLICT(user_id) DO UPDATE SET plan = excluded.plan, updated_at = excluded.updated_at, provider_event_at = excluded.provider_event_at",
            userId, plan, Date.now(), eventAt
          );
        }
      }
      return { duplicate: false };
    });
    if (result.duplicate) return res.json({ ok: true, duplicate: true });
  } catch (error) {
    logError("revenuecat_webhook_failed", error, { requestId: res.locals.requestId });
    return res.status(500).json({ error: "webhook_processing_failed" });
  }
  res.json({ ok: true });
});
const aiLimiter = rateLimit({ windowMs: 60_000, max: 12, prefix: "ai" });

app.get("/v1/health/live", (_req, res) => res.json({ ok: true }));
app.get("/v1/health/ready", async (_req, res) => {
  try {
    const db = await getDb();
    await db.ping();
    res.json({ ok: true, aiConfigured: isAIConfigured() && !DISABLE_AI, trendsConfigured: /^https:\/\//i.test(process.env.TREND_SOURCE_URL?.trim() || "") && !DISABLE_TRENDS, maintenance: MAINTENANCE_MODE, releaseId: RELEASE_ID });
  } catch (error) {
    logError("readiness_failed", error, { requestId: res.locals.requestId });
    res.status(503).json({ ok: false, error: "not_ready" });
  }
});
app.get("/v1/health", async (_req, res) => {
  try {
    const db = await getDb();
    await db.ping();
    res.json({ ok: true, aiConfigured: isAIConfigured() && !DISABLE_AI, trendsConfigured: /^https:\/\//i.test(process.env.TREND_SOURCE_URL?.trim() || "") && !DISABLE_TRENDS, maintenance: MAINTENANCE_MODE, releaseId: RELEASE_ID });
  } catch { res.status(503).json({ ok: false }); }
});

app.use((req, res, next) => {
  if (!MAINTENANCE_MODE) return next();
  res.setHeader("Retry-After", "300");
  return res.status(503).json({ error: "maintenance", requestId: res.locals.requestId });
});

app.get("/v1/trends/weekly", requireAuth, rateLimit({ windowMs: 60_000, max: 30, prefix: "trends" }), async (req, res) => {
  if (DISABLE_TRENDS) return res.status(503).json({ error: "trends_temporarily_disabled" });
  const region = typeof req.query.region === "string" ? req.query.region : "global";
  try {
    const snapshot = await fetchWeeklyTrends(region);
    res.setHeader("Cache-Control", "public, max-age=900, stale-if-error=21600");
    res.json(snapshot);
  } catch (error) {
    logError("trend_fetch_failed", error, { requestId: res.locals.requestId });
    res.status(502).json({ error: "trend_fetch_failed" });
  }
});

app.post("/v1/looks/generate", requireAuth, aiLimiter, upload.single("selfie"), async (req, res) => {
  if (DISABLE_AI) return res.status(503).json({ error: "ai_temporarily_disabled" });
  if (!isAIConfigured()) return res.status(503).json({ error: "ai_not_configured" });
  try {
    const rawInput = req.is("multipart/form-data") ? parseJsonField(req.body.input) : req.body;
    const parsed = lookRequestSchema.safeParse(rawInput);
    if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
    const selfie = req.file ? { imageBase64: req.file.buffer.toString("base64"), mediaType: req.file.mimetype } : undefined;
    const look = await generateLook(parsed.data, selfie);
    res.json(look);
  } catch (err) {
    logError("ai_generation_failed", err, { requestId: res.locals.requestId });
    res.status(502).json({ error: "ai_generation_failed", requestId: res.locals.requestId });
  }
});

app.post("/v1/looks/regenerate", requireAuth, aiLimiter, upload.single("selfie"), async (req, res) => {
  if (DISABLE_AI) return res.status(503).json({ error: "ai_temporarily_disabled" });
  if (!isAIConfigured()) return res.status(503).json({ error: "ai_not_configured" });
  try {
    const rawInput = req.is("multipart/form-data") ? parseJsonField(req.body.input) : req.body.input;
    const parsedInput = lookRequestSchema.safeParse(rawInput);
    const parsedDirection = regenerateDirectionSchema.safeParse(req.body.direction);
    if (!parsedInput.success || !parsedDirection.success) return res.status(400).json({ error: "invalid_input" });
    const selfie = req.file ? { imageBase64: req.file.buffer.toString("base64"), mediaType: req.file.mimetype } : undefined;
    const look = await regenerateLook(parsedInput.data, parsedDirection.data, selfie);
    res.json(look);
  } catch (err) {
    logError("ai_regeneration_failed", err, { requestId: res.locals.requestId });
    res.status(502).json({ error: "ai_generation_failed", requestId: res.locals.requestId });
  }
});



app.post("/v1/closet/analyze", requireAuth, aiLimiter, upload.single("photo"), async (req, res) => {
  if (DISABLE_AI) return res.status(503).json({ error: "ai_temporarily_disabled" });
  if (!isAIConfigured()) return res.status(503).json({ error: "ai_not_configured" });
  if (!req.file) return res.status(400).json({ error: "missing_photo" });
  try {
    const parsed = closetAnalyzeFieldsSchema.safeParse({ languageCode: req.body.languageCode || "en" });
    if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
    const result = await analyzeClosetItem({
      imageBase64: req.file.buffer.toString("base64"),
      mediaType: req.file.mimetype,
      languageCode: parsed.data.languageCode,
    });
    res.json(result);
  } catch (err) {
    logError("closet_analysis_failed", err, { requestId: res.locals.requestId });
    res.status(502).json({ error: "closet_analysis_failed", requestId: res.locals.requestId });
  }
});


// Premium Store Mode product-photo classification. Server-side Plus enforcement
// prevents a modified client from using this paid AI capability for free.
app.post("/v1/store/analyze", requireAuth, requirePlus, aiLimiter, upload.single("photo"), async (req, res) => {
  if (DISABLE_AI) return res.status(503).json({ error: "ai_temporarily_disabled" });
  if (!isAIConfigured()) return res.status(503).json({ error: "ai_not_configured" });
  if (!req.file) return res.status(400).json({ error: "missing_photo" });
  try {
    const parsed = closetAnalyzeFieldsSchema.safeParse({ languageCode: req.body.languageCode || "en" });
    if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
    const result = await analyzeClosetItem({
      imageBase64: req.file.buffer.toString("base64"),
      mediaType: req.file.mimetype,
      languageCode: parsed.data.languageCode,
    });
    res.setHeader("Cache-Control", "no-store");
    res.json(result);
  } catch (err) {
    logError("store_product_analysis_failed", err, { requestId: res.locals.requestId, userId: res.locals.userId });
    res.status(502).json({ error: "store_product_analysis_failed", requestId: res.locals.requestId });
  }
});

// multipart: photo file + JSON fields (planId, styleId, weatherCondition, closetItemLabels[])
app.post("/v1/fit-check/analyze", requireAuth, aiLimiter, upload.single("photo"), async (req, res) => {
  if (DISABLE_AI) return res.status(503).json({ error: "ai_temporarily_disabled" });
  if (!isAIConfigured()) return res.status(503).json({ error: "ai_not_configured" });
  if (!req.file) return res.status(400).json({ error: "missing_photo" });
  try {
    const rawLabels = req.body.closetItemLabels ? parseJsonField(req.body.closetItemLabels) : [];
    const parsed = fitCheckFieldsSchema.safeParse({
      planId: req.body.planId || null,
      styleId: req.body.styleId || null,
      weatherCondition: req.body.weatherCondition || null,
      closetItemLabels: rawLabels,
      languageCode: req.body.languageCode || "en",
    });
    if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
    const result = await analyzeFitCheck({
      imageBase64: req.file.buffer.toString("base64"),
      mediaType: req.file.mimetype,
      ...parsed.data,
    });
    res.json(result);
  } catch (err) {
    logError("fit_check_analysis_failed", err, { requestId: res.locals.requestId });
    res.status(502).json({ error: "ai_analysis_failed", requestId: res.locals.requestId });
  }
});

// Optional weather passthrough — the mobile client calls Open-Meteo directly
// (no key needed) by default, but this endpoint exists so you can swap in a
// paid vendor without a client release, if ever needed.
app.get("/v1/weather/current", requireAuth, rateLimit({ windowMs: 60_000, max: 30, prefix: "weather" }), async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({ error: "invalid_coordinates" });
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,weather_code,wind_speed_10m`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!r.ok) return res.status(502).json({ error: "weather_provider_error" });
    const data = await r.json();
    res.json(mapOpenMeteo(data));
  } catch {
    res.status(502).json({ error: "weather_fetch_failed" });
  }
});

function mapOpenMeteo(data: any) {
  const code = data?.current?.weather_code;
  const temp = data?.current?.temperature_2m;
  const wind = data?.current?.wind_speed_10m;
  if (typeof code !== "number" || typeof temp !== "number" || typeof wind !== "number") {
    throw new Error("weather_provider_payload_invalid");
  }
  let condition = "warm";
  if (code >= 71 && code <= 77) condition = "snowy";
  else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) condition = "rainy";
  else if (wind > 30) condition = "windy";
  else if (temp >= 27) condition = "hot";
  else if (temp <= 8) condition = "cold";
  else condition = "warm";
  return { condition, temperatureC: Math.round(temp) };
}

// Data-access export deliberately excludes password hashes and provider subject IDs.
app.get("/v1/me/export", requireAuth, async (_req, res) => {
  const userId = res.locals.userId;
  try {
    const db = await getDb();
    const user = await db.get<{ id: string; email: string | null; name: string | null; provider: string; created_at: number }>(
      "SELECT id, email, name, provider, created_at FROM users WHERE id = ?", userId
    );
    const entitlement = await db.get<{ plan?: string; updated_at?: number }>(
      "SELECT plan, updated_at FROM entitlements WHERE user_id = ?", userId
    );
    res.setHeader("Cache-Control", "no-store");
    res.json({
      exportedAt: new Date().toISOString(),
      account: user ? { id: user.id, email: user.email, name: user.name, provider: user.provider, createdAt: user.created_at } : null,
      entitlement: { plan: entitlement?.plan === "plus" ? "plus" : "free", updatedAt: entitlement?.updated_at ?? null },
    });
  } catch (error) {
    logError("export_account_failed", error, { requestId: res.locals.requestId, userId });
    res.status(500).json({ error: "export_account_failed" });
  }
});

// Example authenticated route showing how to gate on entitlement.
app.delete("/v1/me", requireAuth, async (_req, res) => {
  const db = await getDb();
  const userId = res.locals.userId;
  try {
    await db.transaction(async (tx) => {
      await tx.run("DELETE FROM revenuecat_events WHERE user_id = ?", userId);
      await tx.run("DELETE FROM entitlements WHERE user_id = ?", userId);
      await tx.run("DELETE FROM users WHERE id = ?", userId);
    });
    res.status(204).end();
  } catch (error) {
    logError("delete_account_failed", error, { requestId: res.locals.requestId, userId });
    res.status(500).json({ error: "delete_account_failed" });
  }
});

app.get("/v1/me/entitlement", requireAuth, async (_req, res) => {
  const db = await getDb();
  const row = await db.get<{ plan?: string }>("SELECT plan FROM entitlements WHERE user_id = ?", res.locals.userId);
  res.setHeader("Cache-Control", "no-store");
  res.json({ plan: row?.plan === "plus" ? "plus" : "free" });
});

// Server-authoritative feature map. Premium server endpoints should compose
// requireAuth + requirePlus rather than trusting a client-side flag.
app.get("/v1/me/features", requireAuth, async (_req, res) => {
  const db = await getDb();
  const row = await db.get<{ plan?: string }>("SELECT plan FROM entitlements WHERE user_id = ?", res.locals.userId);
  const plus = row?.plan === "plus";
  res.setHeader("Cache-Control", "no-store");
  res.json({
    plan: plus ? "plus" : "free",
    features: { runway: plus, storeMode: plus, unlimitedSavedLooks: plus },
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT ? Number(process.env.PORT) : 8787;
const server = app.listen(port, async () => {
  try {
    await getDb();
    logEvent("info", "backend_listening", { port, releaseId: RELEASE_ID, maintenance: MAINTENANCE_MODE, aiConfigured: isAIConfigured() && !DISABLE_AI, trendsConfigured: !DISABLE_TRENDS });
  } catch (error) {
    logError("backend_startup_failed", error);
    server.close(() => process.exit(1));
  }
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logEvent("info", "shutdown_signal", { signal });
  server.close(async () => {
    try { await closeDb(); } finally { process.exit(0); }
  });
  setTimeout(() => process.exit(1), 10_000);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
