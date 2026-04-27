# ====================================================================
# ORCHESTRATOR — Sync PROD → STAGING (todas as fases)
# Data: 24/04/2026
# Branch: feature/v2
# ====================================================================
# Executa todas as fases em sequência com gate de segurança entre elas:
#
#   Phase 0: Validação de pré-requisitos
#   Phase 1: Backup de neondb_v2 (PROD)
#   Phase 2: Aplicar migrations 1146-1203 em neondb_staging
#   Phase 3: Sync dados neondb_v2 → neondb_staging
#   Phase 4: Verificação final
#
# Pré-requisitos:
#   - psql e pg_dump no PATH
#   - NEON_PROD_PASSWORD: senha de neondb_v2
#   - NEON_STAGING_PASSWORD: senha de neondb_staging
#     (pode ser a mesma se compartilham owner no mesmo projeto Neon)
#
# Uso:
#   $env:NEON_PROD_PASSWORD    = 'senha_prod'
#   $env:NEON_STAGING_PASSWORD = 'senha_staging'
#   .\scripts\run-sync-all-phases.ps1
#   .\scripts\run-sync-all-phases.ps1 -DryRun       # simulação completa
#   .\scripts\run-sync-all-phases.ps1 -SkipBackup   # pula Phase 1 (já tem backup Neon snapshot)
#   .\scripts\run-sync-all-phases.ps1 -SkipMigrations  # pula Phase 2 (migrations já aplicadas)
# ====================================================================

param(
    [switch]$DryRun,        # Executa tudo em dry-run (sem modificações)
    [switch]$SkipBackup,    # Pula Phase 1 (já tem snapshot Neon / backup externo)
    [switch]$SkipMigrations # Pula Phase 2 (migrations já aplicadas no staging)
)

$SCRIPTS_DIR = "C:\apps\QWork\scripts"
$STAGING_CONN = "postgresql://neondb_owner:$($env:NEON_STAGING_PASSWORD)@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_staging?sslmode=require&sslcertmode=allow"

$env:PGSSLMODE     = "require"
$env:PGSSLCERTMODE = "allow"

$START_TIME = Get-Date

function Write-Phase($n, $msg) {
    Write-Host ""
    Write-Host "=====================================================================" -ForegroundColor Magenta
    Write-Host "  PHASE $n : $msg" -ForegroundColor Magenta
    Write-Host "=====================================================================" -ForegroundColor Magenta
    Write-Host ""
}

function Check-ExitCode($phase, $exitCode) {
    if ($exitCode -ne 0) {
        Write-Host ""
        Write-Host "ERRO: Phase $phase falhou (exit=$exitCode)." -ForegroundColor Red
        Write-Host "Abortando. Corrija o erro e re-execute." -ForegroundColor Red
        Write-Host ""
        Write-Host "ROLLBACK: neondb_v2 (PROD) nao foi modificado." -ForegroundColor Yellow
        Write-Host "          Se neondb_staging ficou em estado inconsistente," -ForegroundColor Yellow
        Write-Host "          re-execute a partir da Phase que falhou." -ForegroundColor Yellow
        exit $exitCode
    }
}

# ====================================================================
# BANNER
# ====================================================================
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  SYNC PROD → STAGING — ORCHESTRATOR" -ForegroundColor Cyan
Write-Host "  Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Gray
Write-Host "  Branch: feature/v2" -ForegroundColor Gray
if ($DryRun) {
    Write-Host "  MODO: DRY-RUN (nenhuma modificacao sera feita)" -ForegroundColor Yellow
}
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# ====================================================================
# PHASE 0: Validação de pré-requisitos
# ====================================================================
Write-Phase 0 "Validação de pré-requisitos"

$hasErrors = $false

# Verificar NEON_PROD_PASSWORD
if (-not $env:NEON_PROD_PASSWORD) {
    Write-Host "  ERRO: NEON_PROD_PASSWORD nao definida" -ForegroundColor Red
    $hasErrors = $true
} else {
    Write-Host "  OK: NEON_PROD_PASSWORD definida" -ForegroundColor Green
}

# Verificar NEON_STAGING_PASSWORD (fallback para NEON_PROD_PASSWORD)
if (-not $env:NEON_STAGING_PASSWORD) {
    Write-Host "  AVISO: NEON_STAGING_PASSWORD nao definida — usando NEON_PROD_PASSWORD" -ForegroundColor Yellow
    $env:NEON_STAGING_PASSWORD = $env:NEON_PROD_PASSWORD
    $STAGING_CONN = "postgresql://neondb_owner:$($env:NEON_PROD_PASSWORD)@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_staging?sslmode=require&sslcertmode=allow"
} else {
    Write-Host "  OK: NEON_STAGING_PASSWORD definida" -ForegroundColor Green
}

# Verificar psql no PATH
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "  ERRO: psql nao encontrado no PATH" -ForegroundColor Red
    $hasErrors = $true
} else {
    Write-Host "  OK: psql encontrado ($($psqlPath.Source))" -ForegroundColor Green
}

# Verificar pg_dump no PATH
$pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDumpPath) {
    Write-Host "  AVISO: pg_dump nao encontrado — Phase 1 usara apenas psql COPY" -ForegroundColor Yellow
} else {
    Write-Host "  OK: pg_dump encontrado ($($pgDumpPath.Source))" -ForegroundColor Green
}

# Verificar scripts existem
$requiredScripts = @(
    "backup-prod-v2.ps1",
    "apply-migrations-staging-v8.ps1",
    "sync-prod-v2-to-staging.ps1",
    "verify-staging-sync.sql"
)
foreach ($s in $requiredScripts) {
    $path = Join-Path $SCRIPTS_DIR $s
    if (-not (Test-Path $path)) {
        Write-Host "  ERRO: Script nao encontrado: $path" -ForegroundColor Red
        $hasErrors = $true
    } else {
        Write-Host "  OK: $s" -ForegroundColor Green
    }
}

if ($hasErrors) {
    Write-Host ""
    Write-Host "Pre-requisitos nao satisfeitos. Corrija acima e re-execute." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "  Todos os pre-requisitos OK!" -ForegroundColor Green

# ====================================================================
# PHASE 1: Backup de neondb_v2
# ====================================================================
Write-Phase 1 "Backup neondb_v2 (PROD)"

if ($SkipBackup) {
    Write-Host "  Pulando Phase 1 (-SkipBackup ativo)." -ForegroundColor Yellow
    Write-Host "  Assumindo que snapshot Neon foi criado manualmente." -ForegroundColor Gray
} else {
    $backupArgs = @()
    if ($DryRun) { $backupArgs += "-SkipDump" }  # dry-run: apenas verificar estado, sem dump real

    & "$SCRIPTS_DIR\backup-prod-v2.ps1" @backupArgs
    Check-ExitCode 1 $LASTEXITCODE
}

# ====================================================================
# PHASE 2: Aplicar migrations 1146-1203 em neondb_staging
# ====================================================================
Write-Phase 2 "Aplicar migrations 1146-1203 em neondb_staging"

if ($SkipMigrations) {
    Write-Host "  Pulando Phase 2 (-SkipMigrations ativo)." -ForegroundColor Yellow

    # Mas validar que staging realmente tem migration 1203
    $env:PGPASSWORD = $env:NEON_STAGING_PASSWORD
    $maxMig = psql $STAGING_CONN -t -c "SELECT MAX(version) FROM schema_migrations WHERE version < 9000;" 2>&1
    $maxMig = ($maxMig | Where-Object { $_ -match "\d+" } | ForEach-Object { $_.Trim() } | Select-Object -First 1)
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    Write-Host "  Max migration em staging: $maxMig" -ForegroundColor Gray

    if ([int]$maxMig -lt 1203) {
        Write-Host "  AVISO: Max migration $maxMig < 1203." -ForegroundColor Yellow
        Write-Host "  Execute: .\scripts\apply-migrations-staging-v8.ps1" -ForegroundColor Yellow
        Write-Host "  Ou remova -SkipMigrations para aplicar automaticamente." -ForegroundColor Yellow
    } else {
        Write-Host "  Staging ja tem migration 1203+. OK." -ForegroundColor Green
    }
} else {
    $migArgs = @()
    if ($DryRun) { $migArgs += "-DryRun" }

    $env:PGPASSWORD = $env:NEON_STAGING_PASSWORD
    & "$SCRIPTS_DIR\apply-migrations-staging-v8.ps1" @migArgs
    $exitCode = $LASTEXITCODE
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    Check-ExitCode 2 $exitCode
}

# ====================================================================
# PHASE 3: Sync dados neondb_v2 → neondb_staging
# ====================================================================
Write-Phase 3 "Sync dados neondb_v2 → neondb_staging"

$syncArgs = @()
if ($DryRun) { $syncArgs += "-DryRun" }

& "$SCRIPTS_DIR\sync-prod-v2-to-staging.ps1" @syncArgs
Check-ExitCode 3 $LASTEXITCODE

# ====================================================================
# PHASE 4: Verificação final
# ====================================================================
Write-Phase 4 "Verificação final"

$env:PGPASSWORD = $env:NEON_STAGING_PASSWORD
$STAGING_CONN_FOR_VERIFY = "postgresql://neondb_owner:$($env:NEON_STAGING_PASSWORD)@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_staging?sslmode=require&sslcertmode=allow"

if (-not $DryRun) {
    Write-Host "Executando verify-staging-sync.sql..." -ForegroundColor Cyan
    psql $STAGING_CONN_FOR_VERIFY -f "$SCRIPTS_DIR\verify-staging-sync.sql" 2>&1
} else {
    Write-Host "  DRY-RUN: verificacao SQL nao executada." -ForegroundColor Yellow
}

Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

# ====================================================================
# SUMÁRIO FINAL
# ====================================================================
$END_TIME  = Get-Date
$ELAPSED   = $END_TIME - $START_TIME
$elapsed_str = "{0:mm}m{0:ss}s" -f $ELAPSED

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  ORCHESTRATOR CONCLUIDO" -ForegroundColor Cyan
Write-Host "  Duracao total: $elapsed_str" -ForegroundColor Gray
Write-Host ""
if ($DryRun) {
    Write-Host "  MODO DRY-RUN: Nenhuma modificacao foi feita." -ForegroundColor Yellow
    Write-Host "  Para executar de verdade, remova o flag -DryRun." -ForegroundColor Yellow
} else {
    Write-Host "  RESULTADO:" -ForegroundColor White
    Write-Host "    neondb_staging: dados reais de PROD + schema feature/v2 (migration 1203)" -ForegroundColor Green
    Write-Host "    neondb_v2 (PROD): INTACTO (nao modificado)" -ForegroundColor Green
    Write-Host ""
    Write-Host "  PROXIMOS PASSOS (manual):" -ForegroundColor Yellow
    Write-Host "    1. Revisar row counts no output acima" -ForegroundColor Gray
    Write-Host "    2. Fazer smoke tests em staging" -ForegroundColor Gray
    Write-Host "    3. Se OK: fazer deploy de feature/v2 em producao" -ForegroundColor Gray
    Write-Host "    4. Manter neondb_v2 como fallback por 2 semanas" -ForegroundColor Gray
}
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
exit 0
