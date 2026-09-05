import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const requiredFiles = [
  'src/db.ts', 'src/server.ts', 'src/migrations.ts', 'src/observability.ts', 'Dockerfile', '.dockerignore', '.env.example'
];
for (const file of requiredFiles) if (!fs.existsSync(path.join(root, file))) errors.push(`missing:${file}`);

const db = fs.readFileSync(path.join(root, 'src/db.ts'), 'utf8');
const server = fs.readFileSync(path.join(root, 'src/server.ts'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (!pkg.dependencies?.pg) errors.push('pg dependency missing');
if (!/Production requires DB_DRIVER=postgres/.test(db)) errors.push('production postgres fail-closed guard missing');
if (!/transaction<T>/.test(db)) errors.push('transaction abstraction missing');
const migrations = fs.readFileSync(path.join(root, 'src/migrations.ts'), 'utf8');
if (!/schema_migrations/.test(migrations) || !/pg_advisory_lock/.test(migrations)) errors.push('versioned/locked migrations missing');
if (!/\/v1\/health\/ready/.test(server)) errors.push('readiness endpoint missing');
if (!/SIGTERM/.test(server) || !/closeDb/.test(server)) errors.push('graceful shutdown missing');
if (!/postgresql-client/.test(fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8'))) errors.push('postgres backup tools missing from runtime image');
if (/BEGIN IMMEDIATE/.test(server) || /db\.run\("BEGIN/.test(server)) errors.push('raw transaction control leaked into server');

console.log('AI Beauty backend deployment static check');
for (const e of errors) console.error(`BLOCKER: ${e}`);
console.log(`blocking_backend_deployment_issues=${errors.length}`);
process.exitCode = errors.length ? 2 : 0;
