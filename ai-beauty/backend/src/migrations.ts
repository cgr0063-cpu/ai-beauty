import type { AppDb } from "./db.js";

export type Migration = {
  version: number;
  name: string;
  up: (db: AppDb) => Promise<void>;
};

const migrations: Migration[] = [
  {
    version: 1,
    name: "baseline_auth_entitlements_revenuecat",
    async up(db) {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          password_hash TEXT,
          name TEXT,
          provider TEXT NOT NULL DEFAULT 'email',
          google_sub TEXT UNIQUE,
          apple_sub TEXT UNIQUE,
          created_at BIGINT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS entitlements (
          user_id TEXT PRIMARY KEY,
          plan TEXT NOT NULL DEFAULT 'free',
          updated_at BIGINT NOT NULL,
          provider_event_at BIGINT NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS revenuecat_events (
          event_id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          event_type TEXT NOT NULL,
          event_at BIGINT NOT NULL,
          received_at BIGINT NOT NULL
        );
      `);
    },
  },
  {
    version: 2,
    name: "provider_and_revenuecat_indexes",
    async up(db) {
      await db.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_apple_sub ON users(apple_sub) WHERE apple_sub IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_revenuecat_events_user_at ON revenuecat_events(user_id, event_at);
      `);
    },
  },
];

async function ensureMigrationTable(db: AppDb) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at BIGINT NOT NULL
    );
  `);
}

async function applyPending(db: AppDb) {
  await ensureMigrationTable(db);
  const rows = await db.all<{ version: number }>("SELECT version FROM schema_migrations ORDER BY version ASC");
  const applied = new Set(rows.map((row) => Number(row.version)));

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    await db.transaction(async (tx) => {
      const already = await tx.get("SELECT version FROM schema_migrations WHERE version = ?", migration.version);
      if (already) return;
      await migration.up(tx);
      await tx.run(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
        migration.version,
        migration.name,
        Date.now()
      );
    });
  }
}

export async function runMigrations(db: AppDb) {
  if (db.driver !== "postgres") {
    await applyPending(db);
    return;
  }

  // One deploy may start multiple instances at once. A PostgreSQL advisory lock
  // prevents two instances from applying the same migration concurrently.
  const lockKey = 742061331;
  await db.get("SELECT pg_advisory_lock(?) AS locked", lockKey);
  try {
    await applyPending(db);
  } finally {
    await db.get("SELECT pg_advisory_unlock(?) AS unlocked", lockKey);
  }
}

export async function assertSchemaCurrent(db: AppDb) {
  let row: { version?: number } | undefined;
  try {
    row = await db.get<{ version?: number }>("SELECT MAX(version) AS version FROM schema_migrations");
  } catch {
    throw new Error("Database schema is not initialized. Run npm run migrate:prod before starting production traffic.");
  }
  const current = Number(row?.version ?? 0);
  const latest = latestMigrationVersion();
  if (current < latest) {
    throw new Error(`Database schema is behind (${current}/${latest}). Run npm run migrate:prod before starting production traffic.`);
  }
}

export function latestMigrationVersion() {
  return migrations.at(-1)?.version ?? 0;
}
