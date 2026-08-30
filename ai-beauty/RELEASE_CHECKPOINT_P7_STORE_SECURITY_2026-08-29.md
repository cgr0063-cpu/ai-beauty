# P7 — Store Mode + production security pass (2026-08-29)

Implemented in this source package:

- Store Mode now evaluates product description + explicit price/budget + closet metadata + favorite/disliked colors + Saved Looks feedback + verified weekly trend cache.
- BUY is only surfaced when no duplicate/budget/preference blocker exists and the current closet metadata shows useful versatility; SKIP wins for duplicate, over-budget, disliked-color, or previously rejected-style signals.
- Trend support is optional and truth-preserving: stale trend data is date-labelled and no trend is fabricated when the verified feed/cache is unavailable.
- Google ID tokens are verified server-side with configured audiences.
- Apple identity tokens are verified against Apple JWKS with issuer/audience validation; Apple sub is persistently linked so later logins do not depend on Apple returning email again.
- Auth has input length validation and IP rate limiting. AI routes and weather proxy have rate limits; API adds basic security headers and production CORS allow-list support.
- Real backend account deletion endpoint added and mobile Delete Account now calls it before clearing local session data. Local-only dev accounts are actually removed from local credential storage.
- Backend social-provider subject columns/index migration added.

Validation status:

- EN/TR/RU locale leaf-key parity: 531 / 531 / 531.
- Full TypeScript validation cannot be considered complete in this container because project dependencies are not installed; the attempted check fails at missing React/Expo/backend module type resolution before it can be a meaningful release compile.
- `npm install --package-lock-only` could not complete within the available network execution window, so backend lockfile generation remains a release-environment step.

Still requires owner/release environment values and native verification:

- Real API HTTPS URL and deployment DB.
- Google OAuth client IDs and Apple Service/App client ID/capability.
- RevenueCat iOS/Android public SDK keys + products/entitlement + webhook/server reconciliation if server-side premium enforcement is enabled.
- EAS project ownership, Apple/Google signing credentials, physical-device camera/Podyum/permissions/purchase tests.
