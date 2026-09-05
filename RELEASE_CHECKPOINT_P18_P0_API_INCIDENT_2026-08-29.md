# AI Beauty P18 — P0 API validation, entitlement and incident safety

Implemented in this checkpoint:

- Strict Zod validation for Today’s Look/regenerate request bodies, Fit Check multipart fields and Closet analysis fields.
- Strict validation of AI-generated look, Fit Check and closet-classification JSON before returning it to the app.
- Invalid/malformed client JSON now returns controlled 400 instead of flowing into the model layer.
- Fit Check backend prompt explicitly forbids estimated cm/mm/inch/body-size measurements from photos and requires qualitative tailor guidance.
- Reusable server-side `requirePlus` middleware and a no-store server-authoritative `/v1/me/features` response were added. Future premium backend routes must compose auth + this entitlement guard; client flags are not authorization.
- Incident controls: `MAINTENANCE_MODE`, `DISABLE_AI`, `DISABLE_TRENDS`, plus `RELEASE_ID` in health/log context.
- Added incident/rollback runbook that favors application rollback over destructive schema rollback and ties recovery to verified backups.
- Added `scripts/p18-p0-audit.mjs` and root `npm run check:p18`.

Verification performed in this environment:

- release-readiness: 0 blockers
- release-candidate static gate: 0 blockers
- pre-build static gate: 0 blockers
- P15 security gate: 0 blockers
- P16 deployment gate: 0 blockers
- P17 operations gate: 0 blockers
- P18 P0 gate: 0 blockers
- backend deployment static check: 0 blockers
- TypeScript parser/transpile scan: 89 TS/TSX files, 0 syntax/transpile errors
- Source search found no exact numeric cm/mm/inch Fit Check advice.

Not claimed as complete:

- Full dependency-resolved backend/mobile TypeScript build is not proven in this environment because project dependencies are not installed in the extracted source tree.
- Live PostgreSQL migration/backup/restore, RevenueCat webhook delivery, real provider AI calls, and signed Android/iOS device QA still require the owner production/staging services and credentials.
- Store Mode/Runway are locally Plus-gated via RevenueCat state; `requirePlus` is the backend authorization primitive for premium server endpoints, not a claim that purely on-device UI can be remotely secured without a server call.
