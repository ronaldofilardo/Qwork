# Production migration: remove 'master'/'super' profile

Purpose: safely remove legacy user profile 'master'/'super' and ensure all users/roles/policies are migrated to 'admin'.

Pre-reqs:

- Run in a maintenance window
- Ensure `pg_dump`, `psql`, and `pg_restore` are available on the host where you run scripts
- Ensure you have a DB role with enough privileges (apply migrations, create/alter policies, create table backups)

Quick steps (recommended):

1. Create a DB backup (script does this automatically before applying migrations):
   - Linux: `PRODUCTION_CONFIRM=YES PGHOST=... PGPORT=... PGUSER=... PGPASSWORD=... PGDATABASE=... ./scripts/db/apply-migrations-prod.sh`
   - Windows PowerShell: set environment variables and run `scripts\db\apply-migrations-prod.ps1`

2. The scripts will:
   - Create a binary dump `backup_before_remove_super_*.dump`
   - Apply migrations: 099,100,101,102,103,104 (if present)
   - Run `scripts/database/seed-admin.sql` to ensure admin exists
   - Execute verification queries and print results

3. Verification queries are in `scripts/db/verify-no-master.sql` (also run by the script).

Rollback / contingency:

- If anything goes wrong, restore the dump using `pg_restore -h <host> -p <port> -U <user> -d <db> <backup_file>` (test restore in staging first).

Notes & manual steps:

- Migration 103 modifies policy expressions and stores backups in `public.policy_expression_backups`; review the backups and policy changes after the migration.
- If any policies still reference 'master', review them manually and replace/adjust logic as appropriate.

If you'd like, I can:

- A) Run these scripts on a target host if you provide environment variables / temporary access, or
- B) Open a PR adding a GitHub Actions job that can run these on-demand (requires secrets setup), or
- C) Walk a colleague in infra through the steps while they run it interactively.

Reply with **A**, **B** or **C** and provide the required access/approval for option A (temporary creds or a bastion host), or tell me which option you prefer.
