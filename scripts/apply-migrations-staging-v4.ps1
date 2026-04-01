# ====================================================================
# APLICAR MIGRATIONS v4 NO BANCO STAGING — INCREMENTAL (1134-1136)
# Data: 01/04/2026
# Branch: staging
# Target: neondb_staging (Neon)
# ====================================================================
# Este script aplica APENAS as 3 migrations pendentes que o v3 não cobria.
# Pré-requisito: v3 já aplicado (migrations até 1133).
# Todas as migrations são idempotentes (IF EXISTS / IF NOT EXISTS).
# ====================================================================

param(
    [switch]$DryRun  # Modo dry-run: apenas lista, não aplica
)

$NEON_HOST = "ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$NEON_DB = "neondb_staging"
$MIGRATIONS_DIR = "C:\apps\QWork\database\migrations"

# Ler senha de variável de ambiente ou usar fallback
if ($env:NEON_STAGING_PASSWORD) {
    $env:PGPASSWORD = $env:NEON_STAGING_PASSWORD
} else {
    $env:PGPASSWORD = "npg_J2QYqn5oxCzp"
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  SYNC INCREMENTAL STAGING v4 — Migrations 1134-1136" -ForegroundColor Cyan
Write-Host "  Target: $NEON_DB @ $NEON_HOST" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN -- Nenhuma migration sera aplicada" -ForegroundColor Yellow
    Write-Host ""
}

# ====================================================================
# Migrations pendentes (ordem importa: 1134 → 1135 → 1136)
# ====================================================================
$migrations = @(
    # 1134: Fix-up de divergências staging ↔ DEV (root causes)
    #   - clinicas.entidade_id, importacoes_clinica renames, colunas ausentes
    "1134_staging_sync_fixup.sql",

    # 1135: Views tomadores/gestores + plano_id (bridge para 1136)
    #   - Cria plano_id temporário em entidades/clinicas
    #   - Cria views tomadores e gestores
    "1135_staging_views_plano_id.sql",

    # 1136: Remoção definitiva do sistema de planos
    #   - Drop tables, functions, triggers, enums, columns
    #   - Recria view tomadores sem plano_id
    "1136_remocao_definitiva_planos_contratacao.sql"
)

Write-Host "Total de migrations: $($migrations.Count)" -ForegroundColor Yellow
Write-Host ""

$success = 0
$failed = 0
$skipped = 0
$warnings = 0
$errors = @()
$warningList = @()

foreach ($migration in $migrations) {
    $filePath = Join-Path $MIGRATIONS_DIR $migration

    if (-not (Test-Path $filePath)) {
        Write-Host "  SKIP  $migration (arquivo nao encontrado)" -ForegroundColor DarkGray
        $skipped++
        continue
    }

    if ($DryRun) {
        Write-Host "  >> SERIA aplicada: $migration" -ForegroundColor Cyan
        continue
    }

    Write-Host "  >> Aplicando: $migration..." -ForegroundColor Cyan -NoNewline

    $output = psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -f $filePath 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        $hasError = $output | Where-Object { $_ -match "^ERROR:" }
        if ($hasError) {
            $isAlreadyExists = $output | Where-Object { $_ -match "already exists|does not exist|duplicate key|could not create unique|cannot drop" }
            if ($isAlreadyExists) {
                Write-Host " WARN (ja aplicada)" -ForegroundColor Yellow
                $warnings++
                $warningList += $migration
            } else {
                Write-Host " ERRO (exit=0)" -ForegroundColor Red
                $outputStr = ($output | Where-Object { $_ -match "ERROR:" }) -join " | "
                Write-Host "     $outputStr" -ForegroundColor DarkRed
                $failed++
                $errors += $migration
            }
        } else {
            Write-Host " OK" -ForegroundColor Green
            $success++
        }
    } else {
        $isAlreadyExists = $output | Where-Object { $_ -match "already exists|does not exist|duplicate key|could not create unique|cannot drop|violates" }
        if ($isAlreadyExists) {
            Write-Host " WARN (ja aplicada)" -ForegroundColor Yellow
            $warnings++
            $warningList += $migration
        } else {
            Write-Host " ERRO" -ForegroundColor Red
            $outputStr = ($output | Where-Object { $_ -match "ERROR:|psql:" }) -join " | "
            Write-Host "     $outputStr" -ForegroundColor DarkRed
            $failed++
            $errors += $migration
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
    Write-Host "  Warnings (ja aplicadas, OK):" -ForegroundColor Yellow
    $warningList | ForEach-Object { Write-Host "    - $_" -ForegroundColor DarkYellow }
}

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "  Migrations com ERRO (requer atencao):" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}

Write-Host ""

if ($failed -eq 0 -and -not $DryRun) {
    Write-Host "STAGING ATUALIZADO! Migrations 1134-1136 aplicadas." -ForegroundColor Green
    Write-Host "URL: https://staging.qwork.app.br" -ForegroundColor Cyan
} elseif ($DryRun) {
    Write-Host "Dry-run concluido. Nenhuma migration foi aplicada." -ForegroundColor Yellow
} elseif ($failed -gt 0) {
    Write-Host "Verifique os erros acima. Warnings sao normais (idempotentes)." -ForegroundColor Yellow
}

Write-Host ""

# Limpar variável de ambiente
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
