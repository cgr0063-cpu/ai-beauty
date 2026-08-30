import { spawnSync } from "node:child_process";

export function postgresEnv() {
  const raw = (process.env.DATABASE_URL || "").trim();
  if (!/^postgres(?:ql)?:\/\//i.test(raw)) throw new Error("DATABASE_URL must be a PostgreSQL URL");
  const url = new URL(raw);
  const database = url.pathname.replace(/^\//, "");
  if (!url.hostname || !database || !url.username) throw new Error("DATABASE_URL is incomplete");
  const env = {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password || ""),
    PGDATABASE: decodeURIComponent(database),
    PGSSLMODE: process.env.DATABASE_SSL === "disable" ? "disable" : "require",
  };
  return { env, database: decodeURIComponent(database) };
}

export function run(command, args, env) {
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.error?.code === "ENOENT") throw new Error(`${command} is not installed or not on PATH`);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}
