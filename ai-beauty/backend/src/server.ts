import express from "express";
import cors from "cors";
import multer from "multer";
import "dotenv/config";
import { generateLook, regenerateLook, analyzeFitCheck, isAIConfigured } from "./ai.js";
import { authRouter, verifyToken } from "./auth.js";
import { getDb } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

app.use("/v1/auth", authRouter);

app.get("/v1/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: isAIConfigured() });
});

app.post("/v1/looks/generate", async (req, res) => {
  if (!isAIConfigured()) return res.status(503).json({ error: "ai_not_configured" });
  try {
    const look = await generateLook(req.body);
    res.json(look);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "ai_generation_failed" });
  }
});

app.post("/v1/looks/regenerate", async (req, res) => {
  if (!isAIConfigured()) return res.status(503).json({ error: "ai_not_configured" });
  try {
    const { input, direction } = req.body;
    const look = await regenerateLook(input, direction);
    res.json(look);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "ai_generation_failed" });
  }
});

// multipart: photo file + JSON fields (planId, styleId, weatherCondition, closetItemLabels[])
app.post("/v1/fit-check/analyze", upload.single("photo"), async (req, res) => {
  if (!isAIConfigured()) return res.status(503).json({ error: "ai_not_configured" });
  if (!req.file) return res.status(400).json({ error: "missing_photo" });
  try {
    const result = await analyzeFitCheck({
      imageBase64: req.file.buffer.toString("base64"),
      mediaType: req.file.mimetype,
      planId: req.body.planId || null,
      styleId: req.body.styleId || null,
      weatherCondition: req.body.weatherCondition || null,
      closetItemLabels: req.body.closetItemLabels ? JSON.parse(req.body.closetItemLabels) : [],
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "ai_analysis_failed" });
  }
});

// Optional weather passthrough — the mobile client calls Open-Meteo directly
// (no key needed) by default, but this endpoint exists so you can swap in a
// paid vendor without a client release, if ever needed.
app.get("/v1/weather/current", async (req, res) => {
  const { lat, lon } = req.query;
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`
    );
    const data = await r.json();
    res.json(mapOpenMeteo(data));
  } catch {
    res.status(502).json({ error: "weather_fetch_failed" });
  }
});

function mapOpenMeteo(data: any) {
  const code = data?.current?.weather_code ?? 0;
  const temp = data?.current?.temperature_2m ?? 20;
  const wind = data?.current?.wind_speed_10m ?? 0;
  let condition = "warm";
  if (code >= 71 && code <= 77) condition = "snowy";
  else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) condition = "rainy";
  else if (wind > 30) condition = "windy";
  else if (temp >= 27) condition = "hot";
  else if (temp <= 8) condition = "cold";
  else condition = "warm";
  return { condition, temperatureC: Math.round(temp) };
}

// Example authenticated route showing how to gate on entitlement.
app.get("/v1/me/entitlement", async (req, res) => {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.replace("Bearer ", "");
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ error: "unauthorized" });
  const db = await getDb();
  const row = await db.get("SELECT plan FROM entitlements WHERE user_id = ?", payload.sub);
  res.json({ plan: row?.plan ?? "free" });
});

const port = process.env.PORT ? Number(process.env.PORT) : 8787;
app.listen(port, () => {
  console.log(`AI Beauty backend listening on :${port} (AI configured: ${isAIConfigured()})`);
});
