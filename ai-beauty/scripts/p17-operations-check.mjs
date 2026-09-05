import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const errors = [];
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const required = [
  'backend/src/migrations.ts',
  'backend/src/observability.ts',
  'backend/src/migrate-cli.ts',
  'backend/scripts/db-backup.mjs',
  'backend/scripts/db-restore.mjs',
  'BACKUP_RESTORE_RUNBOOK.md',
  'SIGNED_RELEASE_OPERATIONS.md',
];
for (const file of required) if (!fs.existsSync(path.join(root,file))) errors.push(`missing:${file}`);
const db = read('backend/src/db.ts');
const migrations = read('backend/src/migrations.ts');
const server = read('backend/src/server.ts');
const restore = read('backend/scripts/db-restore.mjs');
const pkg = JSON.parse(read('backend/package.json'));
if (!/schema_migrations/.test(migrations)) errors.push('versioned migration table missing');
if (!/pg_advisory_lock/.test(migrations)) errors.push('postgres migration advisory lock missing');
if (!/assertSchemaCurrent/.test(db) || !/DB_MIGRATION_MODE/.test(db)) errors.push('production schema fail-closed/migration mode missing');
if (!pkg.scripts?.['migrate:prod']) errors.push('migrate:prod script missing');
if (!pkg.scripts?.['db:backup'] || !pkg.scripts?.['db:restore']) errors.push('backup/restore package scripts missing');
if (!/--confirm/.test(restore) || !/sha256/i.test(restore)) errors.push('restore confirmation/checksum safety missing');
if (!/requestTelemetry/.test(server) || !/errorHandler/.test(server)) errors.push('request observability/global error handler missing');
if (!/x-request-id/.test(read('backend/src/observability.ts'))) errors.push('request id propagation missing');
console.log('AI Beauty P17 operations gate');
for (const e of errors) console.error(`BLOCKER: ${e}`);
console.log(`blocking_p17_operations_issues=${errors.length}`);
process.exitCode = errors.length ? 2 : 0;
