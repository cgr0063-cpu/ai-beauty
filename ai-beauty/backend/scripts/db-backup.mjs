import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { postgresEnv, run } from "./db-common.mjs";

if ((process.env.DB_DRIVER || "").trim() !== "postgres") throw new Error("DB_DRIVER=postgres is required for production backup");
const { env } = postgresEnv();
const backupDir = path.resolve(process.env.BACKUP_DIR || "./backups");
fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = path.join(backupDir, `ai-beauty-${stamp}.dump`);
run("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", "--file", file], env);
const bytes = fs.readFileSync(file);
const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
fs.writeFileSync(`${file}.sha256`, `${sha256}  ${path.basename(file)}\n`, { mode: 0o600 });
console.log(`backup_created=${file}`);
console.log(`backup_sha256=${sha256}`);
