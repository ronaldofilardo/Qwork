# ====================================================================
# APLICAR MIGRATION v11 NO BANCO STAGING — 1227
# Data: 2026-04-21
# Branch: feature/v2
# Target: neondb_v2 (Neon Cloud)
# ====================================================================
# Migration:
#   1227  remove_codigo_representante_vendedor  → Remove sequências e colunas de código
# ====================================================================

param(
    [switch]$DryRun  # Modo dry-run: apenas lista, não aplica
)

$NEON_HOST = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$NEON_DB = "neondb_staging"
$MIGRATIONS_DIR = "C:\apps\QWork\database\migrations"

# Ler senha
if ($env:NEON_STAGING_PASSWORD) {
    $env:PGPASSWORD = $env:NEON_STAGING_PASSWORD
} elseif ($env:PGPASSWORD) {
    # já definido
} else {
    Write-Host "ERRO: Defina NEON_STAGING_PASSWORD ou PGPASSWORD." -ForegroundColor Red
    Write-Host "  Modo de uso: `$env:NEON_STAGING_PASSWORD = 'sua_senha'; .\apply-migrations-staging-v11.ps1" -ForegroundColor Yellow
    exit 1
}

$env:PGSSLMODE = "require"
$env:PGSSLCERTMODE = "allow"

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  SYNC STAGING v11 — Migration 1227 (Remove codigo fields)" -ForegroundColor Cyan
Write-Host "  Target: $NEON_DB @ $NEON_HOST" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN -- Nenhuma migration sera aplicada" -ForegroundColor Yellow
    Write-Host ""
}

# Migrations a aplicar em ordem
$migrations = @(
    @{ file = "1227_remove_codigo_representante_vendedor.sql"; desc = "Remove seq_representante_codigo, seq_vendedor_codigo, colunas e trigger" }
)

$errors = @()

# VERIFICAÇÃO PRÉ-APPLY: estado atual do staging
if (-not $DryRun) {
    Write-Host "Estado atual do banco (últimas 3 migrations):" -ForegroundColor Gray
    $checkCmd = @"
SELECT version, installed_on FROM schema_migrations ORDER BY installed_on DESC LIMIT 3;
"@
    $checkCmd | psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
    Write-Host ""
}

foreach ($m in $migrations) {
    $filePath = Join-Path $MIGRATIONS_DIR $m.file
    if (-not (Test-Path $filePath)) {
        Write-Host "  [SKIP] $($m.file) — arquivo não encontrado" -ForegroundColor Yellow
        continue
    }

    Write-Host "  [$( if ($DryRun) { 'DRY' } else { 'RUN' } )] $($m.file)" -ForegroundColor White
    Write-Host "         $($m.desc)" -ForegroundColor Gray

    if (-not $DryRun) {
        $output = psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -f $filePath 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  [ERRO] Falha ao aplicar $($m.file)" -ForegroundColor Red
            Write-Host $output -ForegroundColor Red
            $errors += $m.file
        } else {
            Write-Host "  [ OK ] Aplicado com sucesso" -ForegroundColor Green
            if ($output) { Write-Host $output -ForegroundColor Gray }
        }
    }
    Write-Host ""
}

Write-Host "====================================================================" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "  Dry-run concluido. $($migrations.Count) migration listada." -ForegroundColor Yellow
} elseif ($errors.Count -eq 0) {
    Write-Host "  CONCLUIDO: $($migrations.Count) migration aplicada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  ✓ Migration 1227 agora ativa em STAGING (neondb_staging)" -ForegroundColor Green
    Write-Host "  ✓ Sequências removidas: seq_representante_codigo, seq_vendedor_codigo" -ForegroundColor Green
    Write-Host "  ✓ Colunas removidas: representantes.codigo, vendedores.codigo" -ForegroundColor Green
    Write-Host "  ✓ Trigger removido: trg_gerar_codigo_representante" -ForegroundColor Green
} else {
    Write-Host "  CONCLUIDO COM ERROS: $($errors.Count) migration falhou:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "====================================================================" -ForegroundColor Cyan
