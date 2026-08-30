import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const errors = [];
const requireText = (file, needle, label) => {
  const body = read(file);
  if (!body.includes(needle)) errors.push(`${label} missing in ${file}`);
};

requireText('backend/src/server.ts', 'lookRequestSchema.safeParse', 'look request schema validation');
requireText('backend/src/server.ts', 'fitCheckFieldsSchema.safeParse', 'fit-check request validation');
requireText('backend/src/server.ts', 'export async function requirePlus', 'server entitlement guard');
requireText('backend/src/server.ts', '"/v1/me/features"', 'server-authoritative feature map');
requireText('backend/src/ai.ts', 'generatedLookSchema.parse', 'generated look output validation');
requireText('backend/src/ai.ts', 'fitCheckResultSchema.parse', 'fit-check output validation');
requireText('backend/src/ai.ts', 'Never estimate or state exact body/garment measurements', 'no photo measurement rule');
requireText('backend/src/server.ts', 'MAINTENANCE_MODE', 'maintenance switch');
requireText('backend/src/server.ts', 'DISABLE_AI', 'AI kill switch');
requireText('backend/src/server.ts', 'DISABLE_TRENDS', 'trend kill switch');
requireText('INCIDENT_ROLLBACK_RUNBOOK.md', 'Prefer application rollback over schema rollback', 'safe rollback policy');
requireText('backend/src/server.ts', 'Cache-Control", "no-store"', 'entitlement no-store response');

const validation = read('backend/src/validation.ts');
if (!validation.includes('.strict()')) errors.push('strict Zod schemas missing');
if (validation.includes('title: shortString(160),\n    summary:')) errors.push('weekly trend schema drifted from mobile label/notes contract');

const server = read('backend/src/server.ts');
if (/JSON\.parse\(req\.body\.input/.test(server)) errors.push('unsafe direct input JSON.parse remains');
if (/JSON\.parse\(req\.body\.closetItemLabels/.test(server)) errors.push('unsafe direct fit-check JSON.parse remains');

console.log('AI Beauty P18 P0 audit');
for (const e of errors) console.error(`BLOCKER: ${e}`);
console.log(`blocking_p18_p0_issues=${errors.length}`);
process.exitCode = errors.length ? 2 : 0;
