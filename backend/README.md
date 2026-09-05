# AI Beauty backend (reference implementation)

A real, deployable Express + TypeScript backend implementing the API
contract the mobile app's `RemoteAIProvider`, `RemoteAuthProvider`, and
weather passthrough expect. Uses the real Anthropic API for look generation
and Fit Check photo analysis — not a stub.

## Setup

```bash
cd backend
npm install
cp .env.example .env
# fill in ANTHROPIC_API_KEY and JWT_SECRET in .env
npm run dev
```

Server runs on `http://localhost:8787` by default.

Point the mobile app at it by setting, in the app's own `.env`:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8787
```
(use your machine's LAN IP instead of `localhost` when testing on a
physical device via Expo Go, e.g. `http://192.168.1.20:8787`).

## Endpoints

- `GET /v1/health` — liveness check, also reports whether `ANTHROPIC_API_KEY` is set
- `POST /v1/looks/generate` — real Claude call, returns `GeneratedLook` JSON
- `POST /v1/looks/regenerate` — same, with a requested adjustment direction
- `POST /v1/fit-check/analyze` — multipart photo upload, real vision call,
  returns `FitCheckResult` JSON (KEEP/ADJUST/SWAP/BUY policy enforced in the
  system prompt — BUY only for genuine gaps)
- `GET /v1/weather/current?lat&lon` — optional Open-Meteo passthrough (the
  mobile client calls Open-Meteo directly by default; this exists only if
  you later want to swap in a paid weather vendor without a client release)
- `POST /v1/auth/register`, `/login` — bcrypt + JWT email/password auth
- `POST /v1/auth/google`, `/apple` — reference stubs; **see the security
  note below before shipping**
- `GET /v1/me/entitlement` — example authenticated route, reads the
  `entitlements` table (used by the subscription gating example)

## Data

SQLite file (`data.sqlite` by default) with `users` and `entitlements`
tables, created automatically on first run. This is a zero-setup dev store —
swap `src/db.ts` for a managed Postgres/MySQL client before scaling; every
other file only calls the four methods `getDb()` exposes, so the swap is
contained to one file.

## ⚠️ Before shipping to production

1. **Verify social sign-in tokens server-side.** `src/auth.ts`'s `/google`
   and `/apple` handlers currently trust the client-submitted email/sub
   claims. Add `google-auth-library` (verify the Google `id_token`) and
   `apple-signin-auth` (verify the Apple `identityToken` against Apple's
   public keys) before launch — otherwise anyone could POST a fabricated
   email and mint a session for it.
2. Set a strong random `JWT_SECRET`.
3. Put this behind HTTPS (e.g. deploy to Fly.io, Render, Railway, or a
   Cloudflare Worker rewrite) — never serve auth/API traffic over plain HTTP
   outside local development.
4. Add rate limiting to `/v1/auth/*` and `/v1/looks/*`.


## Production migrations and operations

Production PostgreSQL does not mutate schema during normal API startup by default. Run `npm run migrate:prod` as a deployment step before shifting traffic. The API fails closed when `schema_migrations` is missing or behind the current application version. PostgreSQL advisory locking prevents concurrent deploy instances from applying the same migration. `DB_AUTO_MIGRATE=true` exists only for controlled environments where automatic migrations are an explicit operational choice.

Request logs are structured JSON and include an `x-request-id` correlation id, HTTP status and duration. Unhandled errors return a generic error plus the request id; raw exception stacks are not returned to clients.

For database disaster-recovery commands see `../BACKUP_RESTORE_RUNBOOK.md`. The production Docker image includes PostgreSQL client tools and the backup/restore scripts, but database credentials must be injected at runtime through the deployment secret store.
