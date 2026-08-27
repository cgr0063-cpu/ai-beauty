import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "30d" });
}

authRouter.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const { email, password, name } = parsed.data;

  const db = await getDb();
  const existing = await db.get("SELECT id FROM users WHERE email = ?", email);
  if (existing) return res.status(409).json({ error: "email_taken" });

  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  await db.run(
    "INSERT INTO users (id, email, password_hash, name, provider, created_at) VALUES (?, ?, ?, ?, 'email', ?)",
    id,
    email,
    passwordHash,
    name ?? null,
    Date.now()
  );
  await db.run("INSERT INTO entitlements (user_id, plan, updated_at) VALUES (?, 'free', ?)", id, Date.now());

  res.json({ token: signToken(id), user: { id, email, name: name ?? null, provider: "email" } });
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.pick({ email: true, password: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const { email, password } = parsed.data;

  const db = await getDb();
  const user = await db.get("SELECT * FROM users WHERE email = ?", email);
  if (!user || !user.password_hash) return res.status(401).json({ error: "invalid_credentials" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "invalid_credentials" });

  res.json({ token: signToken(user.id), user: { id: user.id, email: user.email, name: user.name, provider: "email" } });
});

/**
 * Reference stubs: in production, verify the Google id_token against
 * Google's tokeninfo endpoint / the Apple identityToken against Apple's
 * public keys server-side before trusting the claimed email/sub. Wire
 * a real verification library (e.g. `google-auth-library`,
 * `apple-signin-auth`) here — kept minimal so this file has no extra
 * required env vars beyond JWT_SECRET.
 */
authRouter.post("/google", async (req, res) => {
  const { email, name, googleSub } = req.body ?? {};
  if (!email || !googleSub) return res.status(400).json({ error: "invalid_input" });

  const db = await getDb();
  let user = await db.get("SELECT * FROM users WHERE email = ?", email);
  if (!user) {
    const id = randomUUID();
    await db.run(
      "INSERT INTO users (id, email, name, provider, created_at) VALUES (?, ?, ?, 'google', ?)",
      id,
      email,
      name ?? null,
      Date.now()
    );
    await db.run("INSERT INTO entitlements (user_id, plan, updated_at) VALUES (?, 'free', ?)", id, Date.now());
    user = { id, email, name };
  }
  res.json({ token: signToken(user.id), user: { id: user.id, email: user.email, name: user.name, provider: "google" } });
});

authRouter.post("/apple", async (req, res) => {
  const { email, name, appleSub } = req.body ?? {};
  if (!appleSub) return res.status(400).json({ error: "invalid_input" });

  const db = await getDb();
  let user = await db.get("SELECT * FROM users WHERE email = ?", email ?? `apple_${appleSub}@privaterelay.local`);
  if (!user) {
    const id = randomUUID();
    const resolvedEmail = email ?? `apple_${appleSub}@privaterelay.local`;
    await db.run(
      "INSERT INTO users (id, email, name, provider, created_at) VALUES (?, ?, ?, 'apple', ?)",
      id,
      resolvedEmail,
      name ?? null,
      Date.now()
    );
    await db.run("INSERT INTO entitlements (user_id, plan, updated_at) VALUES (?, 'free', ?)", id, Date.now());
    user = { id, email: resolvedEmail, name };
  }
  res.json({ token: signToken(user.id), user: { id: user.id, email: user.email, name: user.name, provider: "apple" } });
});

export function verifyToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch {
    return null;
  }
}
