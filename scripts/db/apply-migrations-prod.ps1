<#
apply-migrations-prod.ps1
PowerShell script for Windows environments to backup the DB, apply targeted migrations and run the admin seed.
Usage:
  $env:PRODUCTION_CONFIRM='YES'; $env:PGHOST='...' ; $env:PGPORT='5432' ; $env:PGUSER='postgres' ; $env:PGPASSWORD='pwd' ; $env:PGDATABASE='nr-bps_db' ; .\scripts\db\apply-migrations-prod.ps1
#>

param()

if ($env:PRODUCTION_CONFIRM -ne 'YES') {
  Write-Error "Production run not confirmed. Set PRODUCTION_CONFIRM=YES and re-run."
  exit 1
}

if (-not $env:PGHOST) { Write-Error 'PGHOST not set'; exit 1 }
if (-not $env:PGUSER) { Write-Error 'PGUSER not set'; exit 1 }
if (-not $env:PGPASSWORD) { Write-Error 'PGPASSWORD not set'; exit 1 }
if (-not $env:PGDATABASE) { Write-Error 'PGDATABASE not set'; exit 1 }
$PGPORT = $env:PGPORT; if (-not $PGPORT) { $PGPORT = '5432' }

$ts = Get-Date -Format yyyyMMdd_HHmmss
$backupFile = "backup_before_remove_super_$ts.dump"

Write-Output "[INFO] Creating binary dump: $backupFile"
& pg_dump -h $env:PGHOST -p $PGPORT -U $env:PGUSER -Fc -f $backupFile $env:PGDATABASE

$migFiles = @(
  'database/migrations/099_remove_legacy_profile.sql',
  'database/migrations/100_fix_funcionarios_constraints.sql',
  'database/migrations/101_drop_constraints_then_fix.sql',
  'database/migrations/102_rename_legacy_role.sql',
  'database/migrations/103_update_policy_expressions_replace_legacy_with_admin.sql',
  'database/migrations/104_remove_super_role.sql'
)

foreach ($f in $migFiles) {
  if (Test-Path $f) {
    Write-Output "--- Applying $f ---"
    & psql -h $env:PGHOST -p $PGPORT -U $env:PGUSER -d $env:PGDATABASE -v ON_ERROR_STOP=1 -f $f
  } else {
    Write-Warning "Migration file not found: $f (skipping)"
  }
}

if (Test-Path 'scripts/database/seed-admin.sql') {
  Write-Output "[INFO] Running seed-admin.sql"
  & psql -h $env:PGHOST -p $PGPORT -U $env:PGUSER -d $env:PGDATABASE -v ON_ERROR_STOP=1 -f 'scripts/database/seed-admin.sql'
} else {
  Write-Warning "Seed script not found, skipping seed step."
}

Write-Output "[INFO] Running verification queries..."
& psql -h $env:PGHOST -p $PGPORT -U $env:PGUSER -d $env:PGDATABASE -c "SELECT COUNT(*) AS count_legacy FROM funcionarios WHERE perfil IN ('master','super');"
& psql -h $env:PGHOST -p $PGPORT -U $env:PGUSER -d $env:PGDATABASE -c "SELECT * FROM public.roles WHERE name IN ('master','super');"
& psql -h $env:PGHOST -p $PGPORT -U $env:PGUSER -d $env:PGDATABASE -c "SELECT COUNT(*) FROM public.policy_expression_backups WHERE using_expr ILIKE '%master%' OR with_check_expr ILIKE '%master%';"

Write-Output "[INFO] Done. Inspect outputs above. If any rows remain, review backups and policies for manual changes."
