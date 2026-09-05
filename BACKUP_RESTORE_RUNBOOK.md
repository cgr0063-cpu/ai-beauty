# AI Beauty — Production DB Backup / Restore Runbook

Production uses PostgreSQL only. Do not restore directly over the live database while application instances are accepting writes.

## Backup

1. Export production `DB_DRIVER=postgres` and `DATABASE_URL` in the deployment secret store.
2. Ensure PostgreSQL client tools (`pg_dump`, `pg_restore`) are installed.
3. Run `cd backend && npm run db:backup`.
4. Store both the `.dump` and matching `.sha256` file in encrypted, access-controlled storage outside the application host.
5. Periodically test restoration into a disposable database. A backup that has never been restored is not considered verified.

## Restore

1. Put the API into maintenance/drain mode so no writes occur.
2. Take a fresh pre-restore backup when possible.
3. Point `DATABASE_URL` to the intended restore target and verify the target identity manually.
4. Run `cd backend && npm run db:restore -- --confirm /secure/path/backup.dump`.
5. The script verifies the sibling `.sha256` file. Missing checksums fail closed unless `--allow-unverified` is explicitly supplied.
6. Run `npm run migrate:prod` after restoration.
7. Check `/v1/health/ready`, authentication, entitlement reads and a non-destructive application smoke test before re-enabling traffic.

Never place database URLs, passwords or backup archives in the mobile bundle, Git repository, release ZIP, logs, or support tickets.
