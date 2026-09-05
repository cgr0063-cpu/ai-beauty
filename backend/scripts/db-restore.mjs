import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { postgresEnv, run } from "./db-common.mjs";

const args = process.argv.slice(2);
if (!args.includes("--confirm")) throw new Error("Restore is destructive. Re-run with: --confirm <backup.dump>");
const fileArg = args.find((x) => !x.startsWith("--"));
if (!fileArg) throw new Error("Backup path is required");
const file = path.resolve(fileArg);
if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error("Backup file not found");
if ((process.env.DB_DRIVER || "").trim() !== "postgres") throw new Error("DB_DRIVER=postgres is required for restore");

const checksumPath = `${file}.sha256`;
if (fs.existsSync(checksumPath)) {
  const expected = fs.readFileSync(checksumPath, "utf8").trim().split(/\s+/)[0];
  const actual = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  if (!expected || expected !== actual) throw new Error("Backup checksum verification failed");
} else if (!args.includes("--allow-unverified")) {
  throw new Error("Checksum file is missing. Refusing restore unless --allow-unverified is explicitly supplied");
}

const { env } = postgresEnv();
run("pg_restore", ["--clean", "--if-exists", "--no-owner", "--no-privileges", "--exit-on-error", file], env);
console.log("restore_complete=true");
console.log("Run npm run migrate:prod before serving traffic.");
