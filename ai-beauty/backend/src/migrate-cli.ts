import "dotenv/config";
import { closeDb, getDb } from "./db.js";
import { latestMigrationVersion } from "./migrations.js";
import { logError, logEvent } from "./observability.js";

try {
  process.env.DB_MIGRATION_MODE = "true";
  const db = await getDb();
  await db.ping();
  logEvent("info", "database_migrations_complete", { driver: db.driver, version: latestMigrationVersion() });
  await closeDb();
} catch (error) {
  logError("database_migration_failed", error);
  await closeDb().catch(() => undefined);
  process.exitCode = 1;
}
