# P16 — Deployment / Production DB / Device QA

Implemented in this checkpoint:
- Development SQLite + production PostgreSQL database adapters behind one AppDb interface.
- Production fails closed if DB_DRIVER is not postgres.
- Managed PostgreSQL DATABASE_URL/pool/SSL configuration.
- Transaction helper used by RevenueCat webhook and account deletion.
- Backend liveness and DB-backed readiness endpoints.
- Graceful SIGTERM/SIGINT shutdown and DB close.
- Backend Dockerfile + dockerignore.
- Backend deployment static check and P16 root deployment gate.
- Android signed-device ADB smoke automation.
- Production env validator now requires PostgreSQL.

Not claimed complete:
- No live PostgreSQL instance was available in this environment, so real network DB migration/transaction testing is still required at deployment.
- No signed APK/TestFlight build was available here, so physical-device smoke/manual QA is still pending.
