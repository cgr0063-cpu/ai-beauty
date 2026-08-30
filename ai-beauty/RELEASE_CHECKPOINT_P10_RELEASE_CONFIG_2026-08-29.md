# P10 — Release configuration closeout — 2026-08-29

## Closed in source
- Android application ID: `com.cgrkrd.aibeauty`
- iOS bundle identifier: `com.cgrkrd.aibeauty`
- Production 1024x1024 app icon added.
- Android adaptive icon foreground added.
- EAS project ID placeholder removed from committed app.json.
- `app.config.js` reads the real Expo/EAS project UUID from `EAS_PROJECT_ID` / `EXPO_PUBLIC_EAS_PROJECT_ID`.
- Release-readiness distinguishes source blockers from owner-account cloud-build configuration.

## Verification
- `node scripts/release-readiness.mjs`: blocking_source_issues=0.
- App icon and adaptive icon are valid 1024x1024 PNG files.
- `npm ci` was attempted in the execution environment but timed out before dependencies completed; full dependency-resolved typecheck/native build is therefore not falsely marked passed.

## External owner-account values still required for real production services/build submission
- Expo/EAS project UUID/account link.
- Deployed HTTPS backend URL and backend production secrets.
- Google OAuth client IDs.
- Apple Developer/App Store Connect configuration.
- RevenueCat public SDK keys/product configuration and backend webhook secret.

These values cannot be safely invented in source code.
