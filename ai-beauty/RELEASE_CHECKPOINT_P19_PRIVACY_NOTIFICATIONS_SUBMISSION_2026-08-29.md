# AI Beauty P19 — Privacy, Notifications & Store Submission

## Implemented
- Explicit, revocable AI-photo processing consent. Today's Look never attaches a selfie when consent is off.
- Fit Check / closet photo analysis asks for consent before AI analysis.
- Physical deletion of app-owned selfie, full-body and wardrobe photo files; account deletion also clears current-account photo files and local reminders.
- Selfie/full-body replacement cleanup and Runway temporary-video cache cleanup to reduce orphaned media.
- Export schema v2: account/provider metadata, complete local profile/preferences, Today Context, Saved Looks + feedback, wardrobe metadata, notification/privacy settings and entitlement status.
- Remote `/v1/me/export` endpoint excludes password hashes and Google/Apple subject identifiers.
- Notification categories: daily look, 72-hour inactivity, weekly verified-trend reminder and Saved Look reuse reminder; each is opt-in.
- Permanent notification denial offers OS Settings; notification deep links are allow-listed.
- Sign-out/account deletion cancels local reminders. Account restoration re-syncs that account's reminder preferences.
- Removed misleading cross-device sync copy: style profile/wardrobe/Saved Looks are truthfully described as device-local in this build.
- Store privacy/data-safety submission checklist added.

## Validation
- P19 privacy/notifications gate: 0 blocker.
- Existing source / RC / pre-build / P15 / P16 / P17 / P18 gates: 0 blocker.
- TypeScript parser/transpile syntax check: 90 TS/TSX files, 0 syntax errors.
- i18n key parity: EN/TR/RU 560/560/560.

## Still requires real production evidence
Store privacy forms must be completed against the exact production AI, hosting, RevenueCat and any analytics/crash vendors. Physical-device permission, export, delete, notification tap/deep-link and signed-build QA are not claimed until a signed artifact is installed and tested.
