# AI Beauty P21 — Today's Look Personalization + Social Context

## Implemented
- Explicit coverage preference (`no preference`, `more coverage`, `balanced`, `more open`) in onboarding and Profile.
- Coverage preference is user-selected only; backend prompt explicitly forbids inferring modesty/coverage from photo, country, religion, culture, gender, or identity.
- Optional daily social context: solo, friends, date, partner.
- Optional companion name and zodiac for date/partner context. Companion zodiac is playful supporting flavor only.
- Today’s Look request now carries coverage + social/date/partner signals end-to-end through mobile request validation and backend AI generation.
- Offline look engine also respects explicit coverage and explicit beauty intensity preference.
- Date/partner zodiac can add a small accent-color influence without overriding the user's own preferences.
- Regenerate “Another” now sends a previous-look summary to remote AI and excludes the previous style direction in the offline engine, reducing near-identical repeats.
- Backend request schema gives new P21 fields safe defaults so rolling upgrades from older clients do not fail solely because fields are absent.
- Profile JSON export includes the new coverage and daily social-context fields.

## Validation
- `blocking_p21_issues=0`
- P0–P20 static release gates rerun: 0 blockers.
- EN/TR/RU flattened i18n keys: 590 / 590 / 590, full parity.
- TS/TSX transpile/parser pass: 0 syntax diagnostics.

## Honest remaining external validation
- Full dependency-resolved Expo/native build is not claimed in this environment.
- Real remote AI behavior must still be verified in a signed device build with production backend credentials.
