# AI Beauty — release handoff

This source package is prepared so that release-only credentials/configuration are supplied by the owner rather than invented in source control.

## 1. Mobile production configuration

Copy `.env.example` to the secure CI/EAS environment and provide the real values. Before a production build run:

`npm run release:source-check`

`npm run release:env-check`

The production check intentionally fails when EAS, RevenueCat, Google OAuth, the production HTTPS API URL, or the verified HTTPS weekly trend feed is missing. Runtime still fails honestly if trend retrieval later becomes unavailable: cached data is dated/stale and no current trend is invented.

## 2. Backend production configuration

Provide the values documented in `backend/.env.example`. Before deployment run inside `backend/`:

`npm run validate:production`

Then install, build, and start the backend using the deployment platform of choice. Keep `ANTHROPIC_API_KEY`, `JWT_SECRET`, and `REVENUECAT_WEBHOOK_SECRET` server-side only.

## 3. EAS / store build order

1. Log in to the owner's Expo account and link/create the EAS project so `EAS_PROJECT_ID` is the real UUID.
2. Add mobile public configuration to EAS environment/secrets.
3. Configure Google OAuth clients for package/bundle `com.cgrkrd.aibeauty`.
4. Configure Sign in with Apple for the same iOS bundle identifier.
5. Configure RevenueCat apps/products and entitlement id `plus`; set its webhook Authorization value to the backend webhook secret.
6. Deploy the backend to HTTPS and set `EXPO_PUBLIC_API_BASE_URL`.
7. Run the two mobile release checks above.
8. Run `npm ci`, `npm run typecheck`, then an EAS preview build for physical-device regression testing.
9. Only after the native test matrix passes, run the production Android/iOS builds and store submissions.

## 4. Native tests that cannot be certified by source inspection

Verify camera/photo/location/notification permission allow-deny-permanent-deny behavior, Google and Apple login success/cancel/error, RevenueCat purchase/cancel/restore/expiration, account A → B data isolation, offline/401/429/500/AI timeout behavior, Fit Check raw-photo integrity, Podyum video recording, background/foreground refresh, large text/TalkBack/VoiceOver, and fresh-install/upgrade flows on real Android and iOS devices.

## 5. Production truthfulness rules

Production must fail closed when AI or billing is not configured. A remote Fit Check failure must never turn into a fake local analysis. Missing/stale weekly trend data must remain clearly unavailable/stale. Store Mode must not claim live price or stock unless backed by a real source.
