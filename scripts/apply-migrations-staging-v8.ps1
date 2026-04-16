# ====================================================================
# APLICAR MIGRATIONS v8 NO BANCO STAGING — 1146-1149
# Data: 15/04/2026
# Branch: feature/v2
# Target: neondb_staging (Neon)
# ====================================================================
# Este script aplica as migrations pendentes após v7 (após 1145).
#
# ORDEM CRÍTICA:
#   1146  fix_auditoria_seq_desync        → Corrige dessincronização da sequence auditoria_id_seq
#   1147  create_rate_limit_entries       → Garante tabela rate_limit_entries com índice cleanup
#   1148  leads_asaas_wallet_id           → Adiciona asaas_wallet_id em representantes_cadastro_leads
#   1149  importacao_templates            → Cria tabela importacao_templates (segregada por tenant)
# ====================================================================

param(
    [switch]$DryRun  # Modo dry-run: apenas lista, não aplica
)

$NEON_HOST = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$NEON_DB = "neondb_staging"
$MIGRATIONS_DIR = "C:\apps\QWork\database\migrations"

# Ler senha de variável de ambiente (OBRIGATÓRIO)
if ($env:NEON_STAGING_PASSWORD) {
    $env:PGPASSWORD = $env:NEON_STAGING_PASSWORD
} else {
    Write-Host "ERRO: Variavel de ambiente NEON_STAGING_PASSWORD nao definida." -ForegroundColor Red
    Write-Host "  Defina com: `$env:NEON_STAGING_PASSWORD = 'sua_senha'" -ForegroundColor Yellow
    exit 1
}

# Forçar SSL para Neon
$env:PGSSLMODE = "require"
$env:PGSSLCERTMODE = "allow"

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  SYNC STAGING v8 — Migrations 1146-1149" -ForegroundColor Cyan
Write-Host "  Target: $NEON_DB @ $NEON_HOST" -ForegroundColor Gray
Write-Host "  Cobertura: 1146-1149 (após v7 que cobriu até 1145)" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN -- Nenhuma migration sera aplicada" -ForegroundColor Yellow
    Write-Host ""
}

# ====================================================================
# VERIFICAÇÃO PRÉ-APPLY: estado atual do staging
# ====================================================================
if (-not $DryRun) {
    Write-Host "Estado atual do staging (schema_migrations):" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 10;" 2>&1
    Write-Host ""
}

# ====================================================================
# Migrations a aplicar (ordem importa!)
# ====================================================================
$migrations = @(
    @{ File = "1146_fix_auditoria_seq_desync.sql";         Label = "1146 fix auditoria sequence desync" },
    @{ File = "1147_create_rate_limit_entries.sql";        Label = "1147 create rate_limit_entries" },
    @{ File = "1148_leads_asaas_wallet_id.sql";            Label = "1148 add asaas_wallet_id to leads" },
    @{ File = "1149_importacao_templates.sql";             Label = "1149 create importacao_templates" }
)

Write-Host "Total de migrations: $($migrations.Count)" -ForegroundColor Yellow
Write-Host ""

$success = 0
$failed  = 0
$skipped = 0
$warnings = 0
$errors = @()
$warningList = @()

foreach ($m in $migrations) {
    $filePath = Join-Path $MIGRATIONS_DIR $m.File

    if (-not (Test-Path $filePath)) {
        Write-Host "  SKIP  $($m.Label) (arquivo nao encontrado)" -ForegroundColor DarkGray
        $skipped++
        continue
    }

    if ($DryRun) {
        Write-Host "  >> SERIA aplicada: $($m.Label)" -ForegroundColor Cyan
        continue
    }

    Write-Host "  >> Aplicando: $($m.Label)..." -ForegroundColor Cyan -NoNewline

    $output   = psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -f $filePath 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        $hasError = $output | Where-Object { $_ -match "^ERROR:" }
        if ($hasError) {
            $isIdempotent = $output | Where-Object { $_ -match "already exists|does not exist|duplicate key|could not create unique|cannot drop" }
            if ($isIdempotent) {
                Write-Host " WARN (ja aplicada, ok)" -ForegroundColor Yellow
                $warnings++
                $warningList += $m.Label
            } else {
                Write-Host " ERRO (exit=0)" -ForegroundColor Red
                $outputStr = ($output | Where-Object { $_ -match "ERROR:" }) -join " | "
                Write-Host "     $outputStr" -ForegroundColor DarkRed
                $failed++
                $errors += $m.Label
            }
        } else {
            Write-Host " OK" -ForegroundColor Green
            $success++
        }
    } else {
        $isIdempotent = $output | Where-Object { $_ -match "already exists|does not exist|duplicate key|could not create unique|cannot drop|violates" }
        if ($isIdempotent) {
            Write-Host " WARN (ja aplicada, ok)" -ForegroundColor Yellow
            $warnings++
            $warningList += $m.Label
        } else {
            Write-Host " ERRO" -ForegroundColor Red
            $outputStr = ($output | Where-Object { $_ -match "ERROR:|psql:" }) -join " | "
            Write-Host "     $outputStr" -ForegroundColor DarkRed
            $failed++
            $errors += $m.Label
        }
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Resultado:" -ForegroundColor White
Write-Host "  OK Sucesso:   $success" -ForegroundColor Green
Write-Host "  WARN (skip):  $warnings" -ForegroundColor Yellow
Write-Host "  ERRO:         $failed" -ForegroundColor Red
Write-Host "  Skip (N/A):   $skipped" -ForegroundColor Gray

if ($warningList.Count -gt 0) {
    Write-Host ""
    Write-Host "  Warnings (idempotentes, OK):" -ForegroundColor Yellow
    $warningList | ForEach-Object { Write-Host "    - $_" -ForegroundColor DarkYellow }
}

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "  Migrations com ERRO (requer atencao):" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}

Write-Host ""

# ====================================================================
# REGISTRAR VERSIONS NO schema_migrations (idempotente)
# ====================================================================
if ($failed -eq 0 -and -not $DryRun) {
    Write-Host "Registrando versoes em schema_migrations..." -ForegroundColor Cyan

    $versionsToRegister = @(1146, 1147, 1148, 1149)
    $versionsSql = ($versionsToRegister | ForEach-Object { "($_)" }) -join ","

    $insertSql = "INSERT INTO schema_migrations (version) VALUES $versionsSql ON CONFLICT (version) DO NOTHING;"
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c $insertSql 2>&1
    Write-Host ""
}

# ====================================================================
# VERIFICAÇÃO PÓS-APPLY
# ====================================================================
if ($failed -eq 0 -and -not $DryRun) {
    Write-Host "STAGING ATUALIZADO! Sync v8 aplicado." -ForegroundColor Green
    Write-Host ""
    Write-Host "Executando verificacoes pos-apply..." -ForegroundColor Cyan
    Write-Host ""

    # [1] Últimas migrations registradas
    Write-Host "  [1/4] Ultimas migrations registradas:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 15;" 2>&1

    # [2] Tabela importacao_templates criada
    Write-Host "  [2/4] Tabela importacao_templates:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='importacao_templates' ORDER BY ordinal_position;" 2>&1

    # [3] Coluna asaas_wallet_id em leads
    Write-Host "  [3/4] Coluna asaas_wallet_id em representantes_cadastro_leads:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT column_name FROM information_schema.columns WHERE table_name='representantes_cadastro_leads' AND column_name='asaas_wallet_id';" 2>&1

    # [4] Tabela rate_limit_entries
    Write-Host "  [4/4] Tabela rate_limit_entries:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT column_name FROM information_schema.columns WHERE table_name='rate_limit_entries' ORDER BY ordinal_position;" 2>&1
}
