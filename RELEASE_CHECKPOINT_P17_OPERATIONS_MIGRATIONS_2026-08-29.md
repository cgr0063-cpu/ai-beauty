# AI Beauty P17 — Operations / Migrations / Backup / Observability
Date: 2026-08-29

## Completed in P17
- Replaced ad-hoc startup schema creation with versioned `schema_migrations`.
- Added transactional migration execution and PostgreSQL advisory locking.
- Production API startup no longer mutates schema by default; it fails closed when schema is missing/behind.
- Added explicit `migrate:prod` deployment step. `DB_AUTO_MIGRATE=true` is opt-in only.
- Added PostgreSQL backup and destructive restore scripts with explicit `--confirm` and SHA-256 verification.
- Added backup/restore runbook and signed-release operations runbook.
- Production Docker image now includes PostgreSQL client tools and operational scripts without embedding credentials.
- Added request correlation IDs, structured JSON request logs, centralized 404/500 handling and generic client-safe errors.
- Fixed strict-null social auth creation path found during P17 TypeScript diagnostics.
- Updated old P15 gate to read RevenueCat event uniqueness from the new migration source.

## Verification
- blocking_source_issues=0
- blocking_rc_issues=0
- blocking_prebuild_issues=0
- blocking_p15_security_issues=0
- blocking_p16_deployment_issues=0
- blocking_p17_operations_issues=0
- blocking_backend_deployment_issues=0
- Structural backend production env validator=0 blockers
- All root/backend `.mjs` scripts pass `node --check`.
- Backend TypeScript diagnostics still include missing dependency/type-package errors because dependencies are unavailable in this environment; after filtering dependency-resolution diagnostics, non-dependency diagnostics=0.

## Not falsely claimed
- No live PostgreSQL migration was executed: no owner production DB/credentials are available here.
- `pg_dump`/`pg_restore` could not be end-to-end exercised in this host because PostgreSQL client binaries are not installed here; the production Dockerfile now installs them.
- No signed Android/iOS artifact has been built yet; real EAS/OAuth/RevenueCat/backend/trend credentials remain owner-supplied release inputs.
