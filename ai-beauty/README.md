# AI Beauty

A production-architecture React Native / Expo / TypeScript app: an AI-powered
beauty, fashion, grooming and style **decision assistant** — "What should I
look like today?" — built around Today's Look, Fit Check, Tailor Mode, the
beauty camera enhancer, Store Mode, accounts and subscriptions.

This is a real, runnable Expo Router project plus a real deployable backend
(`/backend`), not a mockup. It works fully offline out of the box (rule-based
demo AI, live keyless weather, on-device accounts, local sandbox billing) and
upgrades feature-by-feature as you add real credentials — no code changes
required, only `.env` values.

## Quick start (mobile app)

```bash
npm install
npx expo start
# press "a" for Android (primary target), "i" for iOS
```

Requires Node 18+, Expo CLI (via npx), and Android Studio / an Android
device with Expo Go, or Xcode for iOS. Note: RevenueCat billing and
Sign in with Apple require a development/EAS build, not Expo Go — see the
table below.

## Quick start (backend, optional but recommended)

```bash
cd backend
npm install
cp .env.example .env   # fill in ANTHROPIC_API_KEY and JWT_SECRET
npm run dev
```

Then in the app's own `.env` (copy from `.env.example`), set
`EXPO_PUBLIC_API_BASE_URL` to your backend's URL. See `backend/README.md`
for full details and a production security note.

## What works right now, with zero configuration

- Full onboarding (skippable, progressive, non-destructive on back)
- Today's Look generation via a real rule-based decision engine
  (`src/domain/lookEngine.ts`) — mood + plan + weather + style + sport all
  feed in, with **safety/weather always outranking style**
- **Live weather**, for real, with no API key: `OpenMeteoWeatherProvider`
  calls the free Open-Meteo API directly from the client using device
  location (opt-in from Profile → Weather), with automatic fallback to a
  seasonal demo estimate if location is denied or the request fails
- Fit Check (KEEP / ADJUST / SWAP / BUY) via `src/domain/fitCheckEngine.ts`,
  including Tailor Mode's "show to tailor" screen
- **Beauty camera enhancer** (`app/camera/enhance.tsx`) for selfie, photo,
  and Runway modes: five real color-grading filters (Warm/Cool/Golden
  Hour/Clean/Glam — actual rendered tint/glow/vignette compositing, not
  cosmetic labels), an adjustable intensity slider, Original↔Enhanced
  compare, save-as-default preference, and save/share of the flattened
  result via `react-native-view-shot`
- **Accounts**: real on-device email/password accounts (hashed, persisted,
  survive restarts) via `DemoAuthProvider` — no backend required; upgrades
  automatically to synced accounts once a backend is configured
- **Subscriptions**: a real Paywall screen with plan selection, purchase,
  and restore, backed by a local sandbox entitlement provider that can
  never charge real money, with a real gating example (free tier capped at
  5 saved looks)
- Closet (local, photo-backed wardrobe)
- Store Mode (BUY / CONSIDER / SKIP)
- Data export (writes a real JSON file of your profile/settings/saved
  looks/wardrobe and opens the native share sheet)
- 4 switchable UI themes, EN/TR/RU localization — **444/444/444 keys verified
  in exact parity**, zero hardcoded user-facing strings anywhere in the app
  (verified by automated scan), including full translation of every style,
  plan, mood, zodiac sign, tarot card (name + flavor message), weather
  condition, and fragrance family, plus every sentence the offline demo
  Today's Look engine generates (skin/hair/makeup/outfit copy, the "Why
  this look" explanation, and the energy line) — not just the surrounding
  chrome. Tone & form-of-address personalization, reduced-motion support.
- All state persists locally via AsyncStorage/SecureStore, so an unfinished
  flow, a saved look, or a signed-in session survives an app restart

None of the above requires an API key. It's real logic, not stub data.

## What needs external credentials to go further

| Feature | Status without config | To enable |
|---|---|---|
| Real generative AI copy + vision Fit Check | Rule-based demo engine active | Deploy `/backend`, set `ANTHROPIC_API_KEY` there and `EXPO_PUBLIC_API_BASE_URL` in the app |
| Cross-device accounts | Real but device-local only | Same backend; email/password syncs automatically once configured |
| Sign in with Google | Honest "not configured" notice, never a dead button | Create an OAuth client, set the three `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` values |
| Sign in with Apple | Honest "not configured" notice | Backend + Apple Developer "Sign In with Apple" capability + a dev/EAS build (not Expo Go) |
| Real subscriptions | Local sandbox entitlement (clearly labeled, no real charges possible) | Create a RevenueCat project, set the two `EXPO_PUBLIC_REVENUECAT_*_KEY` values, and build with EAS (RevenueCat's native module doesn't run in Expo Go) |
| "Show It On Me" try-on preview | Honest "not configured" notice | Implement an image-generation vendor call behind `AIProvider` in your backend, then set `EXPO_PUBLIC_ENABLE_SHOW_IT_ON_ME=true` |
| Cloud sync of app data (not just accounts) | Local-first persistence only | Swap `src/services/storage/persist.ts`'s adapter for one that also syncs to your backend — no store shape changes needed |

**Never** put a real AI/OAuth/billing vendor key into the mobile client.
Weather is the one exception — Open-Meteo is a free public API with no key
and no vendor lock-in, so it's safe to call directly.

## Project structure

```
app/                        Expo Router screens (file-based routing)
  (onboarding)/              Skippable, multi-step onboarding
  (auth)/                    Sign in / sign up (email + Google + Apple)
  (tabs)/                    Home, Explore, Closet, Fit Check entry, Profile
  camera/                    Beauty enhancer (selfie/photo/runway modes)
  fitcheck/                  Fit Check result + Tailor Mode
  subscription/              Paywall
backend/                     Real Express + TypeScript API (see its README)
  src/ai.ts                  Anthropic calls for look generation + Fit Check vision
  src/auth.ts                bcrypt + JWT email auth, Google/Apple stubs
  src/db.ts                  SQLite dev store (swap for Postgres in prod)
  src/server.ts              Route wiring, Open-Meteo passthrough
src/
  design-system/             4 themes, ThemeProvider (incl. reduced motion),
                              reusable components
  i18n/                      en/tr/ru locales (parity-checked), language≠region
  data/                      24 styles, moods, plans/sports, zodiac, tarot,
                              fragrance families, tone & address presets,
                              camera filter presets
  state/                     Zustand stores (settings, user, auth,
                              entitlement, today's context, wardrobe, saved
                              looks) — all AsyncStorage/SecureStore-persisted
  components/                Cross-cutting composed UI (e.g. AuthButtons)
  services/
    providers/ai/             AIProvider interface, Demo + Remote impls,
                               resilient fallback wrapper
    providers/weather/        WeatherProvider interface, Demo + Open-Meteo +
                               Location impls
    providers/auth/           AuthProvider interface, Demo (on-device) +
                               Remote impls
    providers/subscription/   SubscriptionProvider interface, Demo (sandbox)
                               + RevenueCat impls, resilient fallback wrapper
    providers/trend/          TrendProvider interface (Store Mode), Demo impl
    storage/                  AsyncStorage adapter used by every store
    featureFlags.ts            Reads EXPO_PUBLIC_ENABLE_* env flags
  domain/                     Decision engines (look, fit check) + hooks
```

## Adding a language

1. Copy `src/i18n/locales/en.json` to `src/i18n/locales/<code>.json` and
   translate every value (keep keys identical).
2. Register it in `src/i18n/index.ts` (`resources` and `SUPPORTED_LANGUAGES`).
3. If it's RTL (e.g. Arabic), add the code to `RTL_LANGUAGES` — RTL layout
   mirroring is not yet implemented in the UI and should be added alongside.

No screen code changes are needed — every string is pulled via `t(...)`,
and the build is verified to have zero missing or orphaned translation keys.

## Adding a style, mood, plan, zodiac sign, camera filter, etc.

All of these are plain arrays in `src/data/*.ts`. Add an entry; pickers and
the decision engine pick it up automatically — every render site resolves
its display label through `t(\`<namespace>Labels.<id>\`, { defaultValue:
<english label> })`, so a new entry without a translation yet gracefully
falls back to its English label instead of breaking. Add the real TR/RU
translations under the matching namespace in each locale file
(`styleLabels`, `planLabels`, `moodLabels`, `zodiacLabels`, `tarotLabels` +
`tarotMessages`, `weatherLabels`, `fragranceLabels`) when you're ready.

## Design principles this codebase enforces

- **No dead buttons.** Anything not wired to a real backend/vendor renders
  `ComingSoonNotice` instead of a disabled/fake button (Google/Apple
  sign-in, Show It On Me).
- **Every screen has a working back action** via `ScreenHeader`.
- **Editing an earlier choice never deletes later ones** — `todayContextStore`
  setters only touch the field they own.
- **Permissions are requested only at point of use** — camera when taking a
  photo, location only if the user turns on automatic weather, media-library
  write only when saving an enhanced photo — never batched into onboarding.
- **Weather/safety outranks style** in the decision engine for any
  `requiresSafetyPriority` plan (all sport/outdoor contexts).
- **Every icon-only touch target is a real `Pressable`**, not a bare SVG
  icon with an `onPress` prop that may not register touches reliably.
- **Reduced-motion is respected** — screen transitions are disabled when the
  OS accessibility setting is on.

## Known gaps / next steps for a real ship

- RTL layout support for Arabic.
- Push notification scheduling (`expo-notifications` is installed, not yet
  scheduled — e.g. a daily "Today's Look is ready" reminder).
- Server-side verification of Google/Apple tokens in the backend (flagged
  explicitly in `backend/README.md` — currently trusts client-submitted
  claims, which is not safe for production as-is).
- Unit tests for `lookEngine.ts` / `fitCheckEngine.ts` decision logic.
- True ML-based skin smoothing/retouching (the current beauty camera uses
  real, rendered overlay-based color grading — tint, glow, vignette — not a
  neural retouching model; that would need a native image-processing
  pipeline or a backend inference call, both are clean extension points
  behind the same filter-preset data structure in `src/data/cameraFilters.ts`).

See `backend/README.md` for the deploy guide and API contract.
