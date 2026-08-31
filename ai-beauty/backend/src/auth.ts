import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getDb } from "./db.js";
import { rateLimit } from "./security.js";

const JWT_SECRET = process.env.JWT_SECRET?.trim() || "";
if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be configured with at least 32 characters");

const googleAudiences = [process.env.GOOGLE_IOS_CLIENT_ID, process.env.GOOGLE_ANDROID_CLIENT_ID, process.env.GOOGLE_WEB_CLIENT_ID].filter(Boolean) as string[];
const appleAudience = process.env.APPLE_CLIENT_ID?.trim();
const googleClient = new OAuth2Client();
const appleJWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export const authRouter = Router();
authRouter.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 30, prefix: "auth" }));

const credentialsSchema = z.object({ email: z.string().email().max(254), password: z.string().min(8).max(128), name: z.string().trim().min(1).max(80).optional() });
const googleSchema = z.object({ idToken: z.string().min(20).max(10000) });
const appleSchema = z.object({ identityToken: z.string().min(20).max(10000), name: z.string().trim().max(80).nullable().optional() });

function signToken(userId: string) { return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "30d", issuer: "ai-beauty" }); }
function userResponse(user: any, provider: "email"|"google"|"apple") { return { id: user.id, email: user.email ?? null, name: user.name ?? null, provider }; }

async function ensureEntitlement(db: any, id: string) {
  await db.run("INSERT INTO entitlements (user_id, plan, updated_at) VALUES (?, 'free', ?) ON CONFLICT(user_id) DO NOTHING", id, Date.now());
}

async function findOrCreateSocialUser(provider: "google"|"apple", sub: string, email: string | null, name: string | null) {
  const db = await getDb();
  const subColumn = provider === "google" ? "google_sub" : "apple_sub";
  let user = await db.get(`SELECT * FROM users WHERE ${subColumn} = ?`, sub);
  if (user) return user;

  if (email) {
    const canonical = email.trim().toLowerCase();
    user = await db.get("SELECT * FROM users WHERE email = ?", canonical);
    if (user) {
      const existingSub = user[subColumn];
      if (existingSub && existingSub !== sub) throw new Error("provider_account_conflict");
      await db.run(`UPDATE users SET ${subColumn} = ?, name = COALESCE(name, ?) WHERE id = ?`, sub, name, user.id);
      return { ...user, [subColumn]: sub, name: user.name ?? name };
    }
  }

  const id = randomUUID();
  const canonical = email ? email.trim().toLowerCase() : null;
  await db.run(
    `INSERT INTO users (id, email, password_hash, name, provider, google_sub, apple_sub, created_at) VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
    id, canonical, name, provider, provider === "google" ? sub : null, provider === "apple" ? sub : null, Date.now()
  );
  await ensureEntitlement(db, id);
  const created = await db.get("SELECT * FROM users WHERE id = ?", id);
  if (!created) throw new Error("social_user_create_failed");
  return created;
}

authRouter.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const { password, name } = parsed.data; const email = parsed.data.email.trim().toLowerCase(); const db = await getDb();
  if (await db.get("SELECT id FROM users WHERE email = ?", email)) return res.status(409).json({ error: "email_taken" });
  const id = randomUUID(); const passwordHash = await bcrypt.hash(password, 12);
  await db.run("INSERT INTO users (id, email, password_hash, name, provider, created_at) VALUES (?, ?, ?, ?, 'email', ?)", id, email, passwordHash, name ?? null, Date.now());
  await ensureEntitlement(db, id); res.json({ token: signToken(id), user: { id, email, name: name ?? null, provider: "email" } });
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.pick({ email: true, password: true }).safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const email = parsed.data.email.trim().toLowerCase(); const db = await getDb(); const user = await db.get("SELECT * FROM users WHERE email = ?", email);
  if (!user || !user.password_hash || !(await bcrypt.compare(parsed.data.password, user.password_hash))) return res.status(401).json({ error: "invalid_credentials" });
  res.json({ token: signToken(user.id), user: userResponse(user, "email") });
});

authRouter.post("/google", async (req, res) => {
  const parsed = googleSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  if (!googleAudiences.length) return res.status(503).json({ error: "google_token_verification_not_configured" });
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: parsed.data.idToken, audience: googleAudiences });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) return res.status(401).json({ error: "invalid_google_token" });
    const user = await findOrCreateSocialUser("google", payload.sub, payload.email, payload.name ?? null);
    res.json({ token: signToken(user.id), user: userResponse(user, "google") });
  } catch (e: any) { res.status(e?.message === "provider_account_conflict" ? 409 : 401).json({ error: e?.message === "provider_account_conflict" ? e.message : "invalid_google_token" }); }
});

authRouter.post("/apple", async (req, res) => {
  const parsed = appleSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  if (!appleAudience) return res.status(503).json({ error: "apple_token_verification_not_configured" });
  try {
    const { payload } = await jwtVerify(parsed.data.identityToken, appleJWKS, { issuer: "https://appleid.apple.com", audience: appleAudience });
    if (!payload.sub) return res.status(401).json({ error: "invalid_apple_token" });
    const email = typeof payload.email === "string" ? payload.email : null;
    const user = await findOrCreateSocialUser("apple", payload.sub, email, parsed.data.name ?? null);
    res.json({ token: signToken(user.id), user: userResponse(user, "apple") });
  } catch (e: any) { res.status(e?.message === "provider_account_conflict" ? 409 : 401).json({ error: e?.message === "provider_account_conflict" ? e.message : "invalid_apple_token" }); }
});

export function verifyToken(token: string): { sub: string } | null { try { return jwt.verify(token, JWT_SECRET, { issuer: "ai-beauty" }) as { sub: string }; } catch { return null; } }
