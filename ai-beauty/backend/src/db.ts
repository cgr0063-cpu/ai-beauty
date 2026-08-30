import { open, type Database } from "sqlite";
import sqlite3 from "sqlite3";
import pg from "pg";
import { assertSchemaCurrent, runMigrations } from "./migrations.js";

export type DbRow = Record<string, any>;

export interface AppDb {
  readonly driver: "sqlite" | "postgres";
  get<T extends DbRow = DbRow>(sql: string, ...params: any[]): Promise<T | undefined>;
  all<T extends DbRow = DbRow>(sql: string, ...params: any[]): Promise<T[]>;
  run(sql: string, ...params: any[]): Promise<void>;
  exec(sql: string): Promise<void>;
  transaction<T>(fn: (tx: AppDb) => Promise<T>): Promise<T>;
  ping(): Promise<void>;
  close(): Promise<void>;
}

let dbInstance: AppDb | null = null;

function postgresSql(sql: string) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function createSqliteDb(): Promise<AppDb> {
  const raw: Database = await open({
    filename: process.env.DATABASE_FILE ?? "./data.sqlite",
    driver: sqlite3.Database,
  });

  const wrap = (db: Database): AppDb => ({
    driver: "sqlite",
    async get(sql, ...params) { return await db.get(sql, ...params); },
    async all(sql, ...params) { return await db.all(sql, ...params); },
    async run(sql, ...params) { await db.run(sql, ...params); },
    async exec(sql) { await db.exec(sql); },
    async transaction(fn) {
      await db.exec("BEGIN IMMEDIATE");
      try {
        const result = await fn(wrap(db));
        await db.exec("COMMIT");
        return result;
      } catch (error) {
        await db.exec("ROLLBACK");
        throw error;
      }
    },
    async ping() { await db.get("SELECT 1 AS ok"); },
    async close() { await db.close(); },
  });

  // Forward-compatible local migration for older dev databases.
  for (const statement of [
    "ALTER TABLE users ADD COLUMN google_sub TEXT",
    "ALTER TABLE users ADD COLUMN apple_sub TEXT",
    "ALTER TABLE entitlements ADD COLUMN provider_event_at INTEGER NOT NULL DEFAULT 0",
  ]) { try { await raw.exec(statement); } catch {} }

  const db = wrap(raw);
  await runMigrations(db);
  return db;
}

async function createPostgresDb(): Promise<AppDb> {
  const { Pool } = pg;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required when DB_DRIVER=postgres");
  const pool = new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
    ssl: process.env.DATABASE_SSL === "disable" ? false : { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true" },
  });

  const wrapClient = (client: pg.Pool | pg.PoolClient): AppDb => ({
    driver: "postgres",
    async get(sql, ...params) {
      const result = await client.query(postgresSql(sql), params);
      return result.rows[0];
    },
    async all(sql, ...params) {
      const result = await client.query(postgresSql(sql), params);
      return result.rows;
    },
    async run(sql, ...params) { await client.query(postgresSql(sql), params); },
    async exec(sql) { await client.query(sql); },
    async transaction(fn) {
      const tx = await pool.connect();
      try {
        await tx.query("BEGIN");
        const result = await fn(wrapClient(tx));
        await tx.query("COMMIT");
        return result;
      } catch (error) {
        await tx.query("ROLLBACK");
        throw error;
      } finally {
        tx.release();
      }
    },
    async ping() { await client.query("SELECT 1 AS ok"); },
    async close() { if (client === pool) await pool.end(); },
  });

  const db = wrapClient(pool);
  const production = process.env.NODE_ENV === "production";
  const migrationMode = process.env.DB_MIGRATION_MODE === "true";
  const autoMigrate = process.env.DB_AUTO_MIGRATE === "true";
  if (!production || migrationMode || autoMigrate) await runMigrations(db);
  else await assertSchemaCurrent(db);
  return db;
}

export async function getDb(): Promise<AppDb> {
  if (dbInstance) return dbInstance;
  const requested = (process.env.DB_DRIVER || (process.env.NODE_ENV === "production" ? "postgres" : "sqlite")).toLowerCase();
  if (process.env.NODE_ENV === "production" && requested !== "postgres") {
    throw new Error("Production requires DB_DRIVER=postgres; SQLite is development-only");
  }
  dbInstance = requested === "postgres" ? await createPostgresDb() : await createSqliteDb();
  await dbInstance.ping();
  return dbInstance;
}

export async function closeDb() {
  if (!dbInstance) return;
  const db = dbInstance;
  dbInstance = null;
  await db.close();
}
