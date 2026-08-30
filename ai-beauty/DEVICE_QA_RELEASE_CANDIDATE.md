# AI Beauty — Release Candidate Device QA

This checklist is for a real Android/iOS build. A row is PASS only after the behavior is observed on-device; source presence alone is not a pass.

## Gate 0 — environment/build
- `npm run release:source-check` returns `blocking_source_issues=0`.
- `npm run release:rc-check` returns `blocking_rc_issues=0`.
- In the real production build environment, `npm run release:production-check` passes with owner-supplied EAS/backend/OAuth/RevenueCat values.
- Backend `npm run validate:production` passes before deployment.
- Preview build installs on at least one physical Android device; iOS production candidate is tested on a physical iPhone before App Store submission.

## Gate 1 — account/onboarding/privacy
- Fresh install cannot deep-link past auth/onboarding.
- Email sign-up/sign-in works; Google works on Android; Apple works on iOS.
- Switching A → B → A never exposes the other account's wardrobe, Saved Looks, photos, feedback or settings.
- Delete Account removes remote account data and local account-scoped snapshot, then returns to signed-out state.
- Denying camera/photos/location/notification permissions never crashes or produces fabricated AI/photo claims.

## Gate 2 — Today's Look / trends
- First look uses the latest saved mood/plan/style/profile signals.
- Another materially changes the recommendation.
- Weekly trend appears only when a verified feed snapshot exists; source/date are visible where surfaced; stale data is labelled as stale/dated.
- With trend feed unavailable and no cache, no text claims that a trend is current.
- Offline/development AI output is visibly distinguished; production without backend configuration fails closed.

## Gate 3 — Fit Check / Tailor
- Selfie/full-body media is not visible in URLs, route params or navigation history.
- Low-confidence Fit Check offers Retake.
- ADJUST can open Tailor; KEEP does not push tailoring; REPLACE does not pretend tailoring fixes a bad cut.
- Tailor advice never invents cm/mm/inch measurements from a photo; copy/share note works.
- AI/backend outage never returns a fake visual analysis.

## Gate 4 — Store Mode / wardrobe
- Product price above budget influences verdict.
- Strong wardrobe duplicate influences Skip/Consider.
- Wardrobe compatibility and preference feedback influence the explanation.
- Product photo failure falls back to manual input without invented catalog, stock, price or shade data.
- Store Mode does not claim live availability unless a real provider explicitly supplies it.

## Gate 5 — Plus / billing
- Free save limit gates at the intended threshold without deleting prior saves.
- Plus-only Store/Runway routes cannot be bypassed by deep link.
- Purchase cancellation does not grant Plus and is not shown as a fatal purchase error.
- Restore reflects the actual RevenueCat entitlement.
- Entitlement expiry removes Plus only after actual expiration, not merely cancellation.
- App foreground/account change refreshes entitlement state.

## Gate 6 — Runway / media
- Camera front/back switching works.
- 3-2-1 countdown and WALK/TURN/HOLD guidance display correctly.
- 8-second recording completes; microphone denial is handled; retake/share works.
- Saved media remains accessible after navigation and app restart where persistence is promised.

## Gate 7 — notifications/localization/accessibility smoke
- Notification permission flow handles allow, deny and permanent denial without loops.
- Daily reminder and any enabled categories fire at the expected local time and deep-link to a valid screen.
- EN/TR/RU core flows have no raw translation keys or clipped critical CTA text.
- Dark/light mode keeps primary text, errors, disabled states and CTA labels legible.

## Release decision
Ship only when all applicable gates above are observed as PASS on the signed release candidate. External owner credentials/IDs are never replaced with placeholders just to make a check green.
