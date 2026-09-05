# P8 — Billing / Release hardening (2026-08-29)

Implemented:
- RevenueCat customer-info listener updates entitlement live while app is open.
- Foreground resume re-reconciles auth session and billing entitlement.
- Billing/config/network errors fail closed to Free; no demo entitlement in production.
- Purchase cancellation is treated as cancellation, not a purchase failure and never grants Plus.
- Restore now tells the user whether Plus was restored or no active purchase exists.
- Paywall perks are localized in EN/TR/RU and now describe only features actually gated in code.
- Runway video and Advanced Store Mode have screen-level Plus gates, including deep-link entry.
- RevenueCat webhook endpoint can mirror `plus` entitlement to backend per authenticated app user ID.
- Cancellation does not revoke access early; EXPIRATION revokes backend entitlement.

Still owner/config dependent before store release:
- Set final Android package / iOS bundle identifier.
- Set real EAS projectId.
- Configure App Store Connect / Google Play products + RevenueCat entitlement named `plus`.
- Set platform RevenueCat public SDK keys.
- Set backend REVENUECAT_WEBHOOK_SECRET and configure RevenueCat webhook Authorization header.
- Perform signed native purchase/restore/cancel/renew/expiration tests on both stores.
