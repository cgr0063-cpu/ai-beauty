# AI Beauty production incident / rollback runbook

This runbook is intentionally conservative. Do not roll a database schema backward by hand during an incident.

## Fast containment

1. Confirm `/v1/health/live` and `/v1/health/ready`, note `releaseId` and request IDs from failing calls.
2. If the whole API must stop product traffic, set `MAINTENANCE_MODE=true` and redeploy/restart. Health/auth/webhook endpoints remain available; product endpoints return 503 + Retry-After.
3. If the incident is isolated to model calls, set `DISABLE_AI=true`.
4. If the incident is isolated to trend ingestion, set `DISABLE_TRENDS=true`.
5. Do not rotate/delete RevenueCat or auth data as a first response.

## Application rollback

1. Capture current release ID/image tag and current DB migration version.
2. Take a verified database backup before any destructive operation: `npm run db:backup`.
3. Roll back the API image/code to the last known-good build that is compatible with the current DB schema.
4. Keep forward-compatible DB migrations in place. Prefer application rollback over schema rollback.
5. Run readiness, auth, entitlement, trend and AI smoke checks before reopening traffic.
6. Disable `MAINTENANCE_MODE` only after checks pass.

## Database restore (last resort)

A database restore discards data newer than the selected backup. Use only for confirmed database corruption or an explicitly approved recovery event.

1. Put API in maintenance mode.
2. Preserve a backup of the current broken state for investigation.
3. Verify the backup checksum.
4. Use the guarded restore command documented in `BACKUP_RESTORE_RUNBOOK.md`; it requires explicit `--confirm`.
5. Run `migrate:prod` if the restored snapshot is behind the deployed code.
6. Validate account login, RevenueCat entitlement state, and account deletion before reopening traffic.

## Evidence to preserve

Keep release ID, request IDs, UTC timestamps, error event names, migration version, provider status and the exact rollback target. Never paste tokens, DB URLs, webhook secrets or user photo payloads into incident notes.
