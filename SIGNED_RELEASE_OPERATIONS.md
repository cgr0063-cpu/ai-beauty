# AI Beauty — Signed Release Operations

This checklist starts only after production credentials are supplied from their owner accounts.

## Before build
- Run root release/source/RC/prebuild/security/deployment gates.
- Run mobile production env validator and platform-specific signed-build validator.
- Run backend production env/deployment checks and `npm run migrate:prod` against the intended production DB.
- Create and externally store a verified DB backup.
- Confirm `/v1/health/ready` returns ready on the deployed backend.
- Confirm RevenueCat webhook secret/URL and `plus` entitlement mapping.
- Confirm Google/Apple OAuth identifiers exactly match the final package/bundle IDs.

## Signed artifact
- Build Android/iOS from a clean commit/source archive with no secrets committed.
- Record app version, build number/versionCode, source SHA and artifact checksum.
- Install the exact signed artifact intended for distribution on a physical device.
- Execute `DEVICE_QA_RELEASE_CANDIDATE.md`; Android may additionally run `node scripts/android-device-smoke.mjs`.

## Release decision
- No P0/P1 regression may be waived silently.
- A failed payment, auth, camera, Fit Check privacy, account isolation/delete, entitlement, or backend readiness test blocks release.
- Trend/weather provider failure must degrade without invented current data.
- Upload only the QA-approved signed artifact to the corresponding store track.
- After rollout, monitor 5xx/error logs, auth failures, RevenueCat webhook failures and readiness health. Roll back/stop rollout on systemic failures.

## P18 API / entitlement / incident gate

Before promoting a signed build:

- Run `npm run check:p18` at the app repository root.
- Run backend `npm run validate:production` and `npm run check:deployment`.
- Confirm RevenueCat webhook test updates `/v1/me/entitlement` for the same authenticated app user ID.
- Confirm premium backend routes use `requireAuth` + `requirePlus`; never trust a request body/client flag for Plus authorization.
- Exercise one invalid request against look, closet and Fit Check endpoints and confirm HTTP 400 without model invocation.
- Confirm malformed model JSON becomes a controlled 502 and does not reach the mobile renderer unchecked.
- Confirm `DISABLE_AI=true`, `DISABLE_TRENDS=true`, and `MAINTENANCE_MODE=true` each fail closed in staging.
- Record `RELEASE_ID`, migration version, DB backup checksum and rollback target before production promotion.
