#!/usr/bin/env bash
set -euo pipefail

# apply-migrations-prod.sh
# Uso: PRODUCTION_CONFIRM=YES PGHOST=... PGPORT=... PGUSER=... PGPASSWORD=... PGDATABASE=... ./scripts/db/apply-migrations-prod.sh

if [ "${PRODUCTION_CONFIRM:-}" != "YES" ]; then
  echo "ERROR: Production run not confirmed. Set PRODUCTION_CONFIRM=YES before running."
  exit 1
fi

: ${PGHOST:?Need PGHOST}
: ${PGPORT:=5432}
: ${PGUSER:?Need PGUSER}
: ${PGPASSWORD:?Need PGPASSWORD}
: ${PGDATABASE:?Need PGDATABASE}

export PGPASSWORD

TS=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_before_remove_super_$TS.dump"

echo "[INFO] Creating binary dump: $BACKUP_FILE"
pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -Fc -f "$BACKUP_FILE" "$PGDATABASE"

# Only apply migrations that are relevant to removing legacy profiles (idempotent)
MIG_FILES=(
  "database/migrations/099_remove_legacy_profile.sql"
  "database/migrations/100_fix_funcionarios_constraints.sql"
  "database/migrations/101_drop_constraints_then_fix.sql"
  "database/migrations/102_rename_legacy_role.sql"
  "database/migrations/103_update_policy_expressions_replace_legacy_with_admin.sql"
  "database/migrations/104_remove_super_role.sql"
)

echo "[INFO] Applying migrations (targeted list):"
for f in "${MIG_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "--- Applying $f ---"
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$f"
  else
    echo "[WARN] Migration file not found: $f (skipping)"
  fi
done

# Run seed to ensure admin exists
if [ -f "scripts/database/seed-admin.sql" ]; then
  echo "[INFO] Running seed-admin.sql"
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "scripts/database/seed-admin.sql"
else
  echo "[WARN] Seed script scripts/database/seed-admin.sql not found, skipping seed step."
fi

echo "[INFO] Migration completed successfully."

echo "If you need to rollback, restore the dump using pg_restore -h <host> -p <port> -U <user> -d <db> <backup_file>."