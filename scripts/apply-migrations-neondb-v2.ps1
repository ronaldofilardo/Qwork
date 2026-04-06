# ====================================================================
# APLICAR MIGRATIONS PENDENTES NO neondb_v2 (PROD Blue/Green)
# Data: 06/04/2026
# Target: neondb_v2 (banco que substituirá neondb em PROD)
# ====================================================================
# Estado atual do neondb_v2: migration 1143 + dados migrados
# Migrations a aplicar: 9000, 9001, 1144, 1145
# ====================================================================

param(
    [switch]$DryRun
)

$NEON_H = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$NEON_U = "neondb_owner"
$TARGET_DB = "neondb_v2"
$M = "C:\apps\QWork\database\migrations"

if ($env:NEON_PROD_PASSWORD) {
    $env:PGPASSWORD = $env:NEON_PROD_PASSWORD
} else {
    Write-Host "ERRO: NEON_PROD_PASSWORD nao definida." -ForegroundColor Red
    exit 1
}

$env:PGSSLMODE = "require"
$env:PGSSLCERTMODE = "allow"

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  SYNC neondb_v2 — Migrations 9000/9001 + 1144/1145" -ForegroundColor Cyan
Write-Host "  Target: $TARGET_DB @ $NEON_H" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN -- nenhuma migration sera aplicada" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Estado atual (schema_migrations):" -ForegroundColor Gray
psql -h $NEON_H -U $NEON_U -d $TARGET_DB -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 10;"
Write-Host ""

$migrations = @(
    @{ File = "9000_sync_staging_with_dev.sql";             Label = "9000 big sync cumulativo (idempotente)" },
    @{ File = "9001_sync_indexes_staging_with_dev.sql";     Label = "9001 sync indexes" },
    @{ File = "1144_fix_laudos_emissor_cpf_fk_to_usuarios.sql"; Label = "1144 fix FK emissor_cpf -> usuarios" },
    @{ File = "1145_drop_fk_laudos_emissor_cpf.sql";        Label = "1145 drop FK emissor_cpf total" }
)

$success = 0; $failed = 0; $warnings = 0
$errors = @(); $warningList = @()

foreach ($m in $migrations) {
    $filePath = Join-Path $M $m.File
    if (-not (Test-Path $filePath)) {
        Write-Host "  SKIP  $($m.Label) (arquivo nao encontrado)" -ForegroundColor DarkGray
        continue
    }
    if ($DryRun) {
        Write-Host "  >> SERIA aplicada: $($m.Label)" -ForegroundColor Cyan
        continue
    }
    Write-Host "  >> Aplicando: $($m.Label)..." -ForegroundColor Cyan -NoNewline
    $out = psql -h $NEON_H -U $NEON_U -d $TARGET_DB -f $filePath 2>&1
    $exitCode = $LASTEXITCODE
    $hasError = $out | Where-Object { $_ -match "^ERROR:" }
    if ($exitCode -eq 0 -and -not $hasError) {
        Write-Host " OK" -ForegroundColor Green; $success++
    } elseif ($hasError -and ($out | Where-Object { $_ -match "already exists|does not exist|duplicate key" })) {
        Write-Host " WARN (idempotente, ok)" -ForegroundColor Yellow; $warnings++; $warningList += $m.Label
    } else {
        Write-Host " ERRO" -ForegroundColor Red; $failed++; $errors += $m.Label
        $out | Where-Object { $_ -match "ERROR:" } | Select-Object -First 3 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkRed }
    }
}

Write-Host ""
Write-Host "Resultado: OK=$success  WARN=$warnings  ERRO=$failed" -ForegroundColor White
Write-Host ""

if ($failed -eq 0 -and -not $DryRun) {
    Write-Host "Registrando versoes em schema_migrations..." -ForegroundColor Cyan
    psql -h $NEON_H -U $NEON_U -d $TARGET_DB -c "INSERT INTO schema_migrations (version) VALUES (9000),(9001),(1144),(1145) ON CONFLICT (version) DO NOTHING;"
    Write-Host ""

    Write-Host "Verificacoes pos-apply:" -ForegroundColor Cyan

    Write-Host "  [1/6] Ultimas migrations:" -ForegroundColor Gray
    psql -h $NEON_H -U $NEON_U -d $TARGET_DB -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 10;"

    Write-Host "  [2/6] Tabelas novas (laudos_storage_log, rate_limit_entries):" -ForegroundColor Gray
    psql -h $NEON_H -U $NEON_U -d $TARGET_DB -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('laudos_storage_log','rate_limit_entries');"

    Write-Host "  [3/6] FK emissor_cpf removida (0 rows = OK):" -ForegroundColor Gray
    psql -h $NEON_H -U $NEON_U -d $TARGET_DB -c "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name='laudos' AND constraint_name LIKE '%emissor_cpf%';"

    Write-Host "  [4/6] Colunas legacy removidas (0 rows = OK):" -ForegroundColor Gray
    psql -h $NEON_H -U $NEON_U -d $TARGET_DB -c "SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('entidades','clinicas') AND column_name IN ('data_liberacao_login','pagamento_confirmado');"

    Write-Host "  [5/6] Views criticas:" -ForegroundColor Gray
    psql -h $NEON_H -U $NEON_U -d $TARGET_DB -c "SELECT table_name FROM information_schema.views WHERE table_schema='public' AND table_name IN ('tomadores','gestores','v_solicitacoes_emissao') ORDER BY table_name;"

    Write-Host "  [6/6] Contagens de dados:" -ForegroundColor Gray
    psql -h $NEON_H -U $NEON_U -d $TARGET_DB -c "SELECT 'clinicas' t, count(*) FROM clinicas UNION ALL SELECT 'entidades', count(*) FROM entidades UNION ALL SELECT 'funcionarios', count(*) FROM funcionarios UNION ALL SELECT 'avaliacoes', count(*) FROM avaliacoes UNION ALL SELECT 'laudos', count(*) FROM laudos UNION ALL SELECT 'lotes_avaliacao', count(*) FROM lotes_avaliacao ORDER BY t;"

    Write-Host ""
    Write-Host "====================================================================" -ForegroundColor Cyan
    Write-Host "  neondb_v2 pronto para receber DATABASE_URL no Vercel!" -ForegroundColor Green
    Write-Host "  Rollback: reverter DATABASE_URL para connection string do neondb" -ForegroundColor Gray
    Write-Host "====================================================================" -ForegroundColor Cyan
}

Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
