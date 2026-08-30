# AI Beauty P15 — Security + Signed Build Gate
Date: 2026-08-29

## Implemented
- RevenueCat webhook idempotency via unique provider event IDs.
- Out-of-order RevenueCat events cannot overwrite a newer entitlement state.
- Only expiration events carrying the `plus` entitlement can revoke Plus.
- RevenueCat event history is removed during real account deletion.
- First-party `/v1/trends/weekly` endpoint now requires app authentication and remains rate-limited.
- Mobile sends its bearer token only to the first-party trend proxy; it never forwards the token to an explicitly configured third-party trend feed.
- `/v1/weather/current` backend passthrough now also requires authentication and rate limiting.
- Signed-build readiness supports `BUILD_PLATFORM=android|ios|all`, so Android and iOS credentials can be validated independently without weakening the final dual-store gate.
- Added `release:p15-security-check` and included it in the production release chain.

## Static verification performed
- release-readiness: 0 blockers
- release-candidate gate: 0 blockers
- pre-build gate: 0 blockers
- P15 security gate: 0 blockers
- Android structural signed-build validator: 0 blockers
- iOS structural signed-build validator: 0 blockers
- Backend structural production env validator: 0 blockers

## External values still required for a real signed build
The structural tests used non-secret syntactically valid test values only. No owner credential was written into the source package. A real build still requires the owner's EAS project UUID, deployed HTTPS backend URL, Google OAuth IDs, RevenueCat public SDK keys, backend secrets, Apple configuration, and real trend source.

## Important
A full Expo native build/typecheck is still not claimed as passed in this environment because the dependency installation previously timed out. Device QA remains required on signed artifacts.
