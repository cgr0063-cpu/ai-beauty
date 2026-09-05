# Backend

The reference backend described here has been implemented for real — see
the [`/backend`](./backend) folder, not this file.

- Deploy guide, endpoint contract, and data model: [`backend/README.md`](./backend/README.md)
- Source: `backend/src/server.ts` (routes), `backend/src/ai.ts` (real
  Anthropic calls for look generation + Fit Check vision), `backend/src/auth.ts`
  (bcrypt + JWT email auth, Google/Apple stubs), `backend/src/db.ts` (SQLite
  dev store)

This file is kept only so old links don't 404; it intentionally has no
content of its own to avoid drifting out of sync with the real backend.
