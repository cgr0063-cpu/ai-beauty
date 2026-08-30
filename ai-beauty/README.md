# AI Beauty

AI Beauty is an Expo / React Native / TypeScript mobile app with an Express / TypeScript backend. The product is a personal beauty and style decision assistant built around Today’s Look, Fit Check, Tailor, Saved Looks, Store Mode and Runway.

## Current source status

This repository is the P8 working source. It is **not yet a signed App Store / Google Play release**. The application code contains production guards, but final store release still requires owner-controlled credentials and native-device verification.

Implemented product flows include:

- onboarding and EN/TR/RU localization;
- Today’s Look using mood, plan, weather, style, wardrobe, age, color preferences, saved-look feedback and a verified weekly trend feed;
- Saved Looks with delete/detail/feedback and a five-look Free limit;
- Fit Check with remote vision support, honest failure states and Tailor guidance that does not invent exact measurements;
- local wardrobe with photo-backed items;
- notifications and re-engagement scheduling controls;
- weekly trend cache that never fabricates a current trend when no verified feed is available;
- Store Mode decision support using budget, wardrobe, preferences and verified trend context;
- Runway video capture with countdown and WALK / TURN / HOLD guidance;
- Plus paywall, RevenueCat provider, restore flow and live entitlement updates;
- Google / Apple server-side identity-token verification when the corresponding backend credentials are configured;
- authenticated AI endpoints, request limits, account deletion and RevenueCat webhook entitlement mirroring.

## Production safety rules

Production builds do not intentionally fall back to fake AI, local auth or sandbox billing when production configuration is missing. Remote Fit Check failures must not be presented as genuine visual analysis. Weekly trend data is only labelled current when it comes from the configured feed and is within its freshness window.

The backend keeps AI vendor secrets server-side. Never ship `ANTHROPIC_API_KEY`, `JWT_SECRET` or the RevenueCat webhook secret inside the mobile app.

## Development start

```bash
npm install
npx expo start
```

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

For remote AI/auth, set the mobile `EXPO_PUBLIC_API_BASE_URL` to the deployed backend. RevenueCat and Sign in with Apple require a native development/EAS build; they do not represent a complete billing test inside Expo Go.

## Owner-controlled configuration still required before store submission

- Replace `com.aibeauty.app` with the final Android package and iOS bundle identifier.
- Replace `REPLACE_WITH_EAS_PROJECT_ID` in `app.json` with the real EAS project ID.
- Configure App Store Connect and Google Play products in RevenueCat with an entitlement named `plus`.
- Set the platform RevenueCat public SDK keys.
- Configure the backend RevenueCat webhook secret and matching Authorization header in RevenueCat.
- Configure Google OAuth client IDs and Apple service/bundle audience values.
- Deploy the backend with a strong JWT secret, production database/storage strategy, HTTPS and the intended CORS allow-list.
- Configure a verified `EXPO_PUBLIC_TREND_FEED_URL`; production validation blocks release without the weekly fashion/beauty feed.
- Replace/confirm production icon, store artwork, privacy policy URL, terms URL and support contact.

## Release verification still required

A real signed Android/iOS build must be tested for camera/photo/location/notification permission allow-deny flows; Google and Apple login; purchase, cancel, pending, restore, renewal and expiration; account A → account B data isolation; offline/401/429/500/timeout paths; large/corrupt photos; background/foreground entitlement refresh; Android Back and iOS swipe-back; Dynamic Type/TalkBack/VoiceOver; and the final store privacy/subscription disclosures.

The source package includes `RELEASE_CHECKPOINT_*.md` files with the implementation checkpoints and remaining owner/store dependencies.

## P9 final source hardening

The final source audit removed photo file URIs from navigation, added guarded deep-link entry, account-scoped local snapshots, safer auth-provider session cleanup, and first-login onboarding continuation. See `RELEASE_CHECKPOINT_P9_FINAL_AUDIT_2026-08-29.md`.

Run `node scripts/release-readiness.mjs` before any store build. It intentionally fails while the final app IDs, EAS project ID, or production icon are placeholders.
