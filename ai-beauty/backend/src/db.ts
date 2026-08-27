import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";

let dbInstance: Database | null = null;

/**
 * SQLite is used here purely as a zero-setup local/dev reference store.
 * For production, replace this module's `getDb()` with a real Postgres/
 * MySQL client — every caller only uses the four methods below, so the
 * swap is contained to this one file.
 */
export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  dbInstance = await open({
    filename: process.env.DATABASE_FILE ?? "./data.sqlite",
    driver: sqlite3.Database,
  });
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      provider TEXT NOT NULL DEFAULT 'email',
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS entitlements (
      user_id TEXT PRIMARY KEY,
      plan TEXT NOT NULL DEFAULT 'free',
      updated_at INTEGER NOT NULL
    );
  `);
  return dbInstance;
}
