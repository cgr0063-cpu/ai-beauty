import fs from 'node:fs';
const errors = [];
const server = fs.readFileSync('backend/src/server.ts','utf8');
const db = fs.readFileSync('backend/src/db.ts','utf8');
const migrations = fs.readFileSync('backend/src/migrations.ts','utf8');
const trends = fs.readFileSync('src/services/trends/weeklyTrends.ts','utf8');
const signed = fs.readFileSync('scripts/signed-build-readiness.mjs','utf8');

const requireText = (text, needle, message) => { if (!text.includes(needle)) errors.push(message); };
requireText(server, 'event_timestamp_ms', 'RevenueCat webhook must use provider event timestamps');
requireText(server, 'revenuecat_events', 'RevenueCat webhook must persist event ids for idempotency');
requireText(server, 'eventAt >= lastEventAt', 'RevenueCat webhook must ignore out-of-order older entitlement events');
requireText(server, 'INACTIVE_REVENUECAT_EVENTS.has(type) && entitlementIds.includes("plus")', 'Only plus expiration may revoke plus');
requireText(migrations, 'event_id TEXT PRIMARY KEY', 'RevenueCat event ids must be unique in persistence');
requireText(server, 'app.get("/v1/trends/weekly", requireAuth,', 'First-party trend endpoint must require auth');
requireText(trends, 'headers.Authorization = `Bearer ${token}`', 'Mobile trend proxy must send auth token');
requireText(trends, '!CONFIGURED_FEED_URL', 'Bearer token must not be sent to third-party trend feeds');
requireText(signed, "BUILD_PLATFORM", 'Signed-build validator must support platform-specific validation');

console.log('AI Beauty P15 security gate');
for (const e of errors) console.error(`BLOCKER: ${e}`);
console.log(`blocking_p15_security_issues=${errors.length}`);
process.exitCode = errors.length ? 2 : 0;
