# Script de Higienização do Diretório /scripts
# Data: 31 de janeiro de 2026
# Objetivo: Organizar scripts movendo-os para diretórios apropriados

[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$Force,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$scriptsRoot = Split-Path -Parent $PSScriptRoot

Write-Host "🧹 Script de Higienização do Diretório /scripts" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "⚠️  Modo DRY RUN: Nenhum arquivo será movido" -ForegroundColor Yellow
    Write-Host ""
}

# Contadores
$movedCount = 0
$skippedCount = 0
$errors = @()

# Função auxiliar para mover arquivo
function Move-ScriptFile {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$Category
    )
    
    if (-not (Test-Path $Source)) {
        Write-Host "  ⚠️  Não encontrado: $Source" -ForegroundColor Yellow
        $script:skippedCount++
        return $false
    }
    
    $fileName = Split-Path -Leaf $Source
    $destPath = Join-Path $Destination $fileName
    
    # Verificar se destino já existe
    if (Test-Path $destPath) {
        if ($Force) {
            Write-Host "  🔄 Sobrescrevendo: $fileName → $Category/" -ForegroundColor Yellow
        } else {
            Write-Host "  ⏭️  Já existe: $fileName (use -Force para sobrescrever)" -ForegroundColor Gray
            $script:skippedCount++
            return $false
        }
    }
    
    if ($DryRun) {
        Write-Host "  📦 [DRY RUN] $fileName → $Category/" -ForegroundColor Cyan
    } else {
        try {
            # Criar diretório se não existir
            if (-not (Test-Path $Destination)) {
                New-Item -ItemType Directory -Path $Destination -Force | Out-Null
            }
            
            Move-Item -Path $Source -Destination $destPath -Force:$Force
            Write-Host "  ✅ Movido: $fileName → $Category/" -ForegroundColor Green
            $script:movedCount++
        } catch {
            Write-Host "  ❌ Erro ao mover $fileName : $_" -ForegroundColor Red
            $script:errors += "Erro ao mover $fileName : $_"
            return $false
        }
    }
    
    return $true
}

# ============================================================================
# FASE 1: SCRIPTS DE CHECK
# ============================================================================
Write-Host "`n📋 FASE 1: Organizando scripts de CHECK" -ForegroundColor Magenta
Write-Host "----------------------------------------`n" -ForegroundColor Magenta

$checksDir = Join-Path $scriptsRoot "checks"
$checkScripts = @(
    "check-all-avaliacoes.cjs",
    "check-backblaze.mts",
    "check-clinicas.ts",
    "check-cobranca-sql.cjs",
    "check-contratantes.ts",
    "check-cpf.ts",
    "check-data.ts",
    "check-db.ts",
    "check-function.cjs",
    "check-get-permissions.cjs",
    "check-laudo-id-mismatch.cjs",
    "check-login.js",
    "check-lote-2.ts",
    "check-lote-5.ts",
    "check-lotes-status.ts",
    "check-pendentes.mjs",
    "check-puppeteer-launch.ts",
    "check-puppeteer.ts",
    "check-quality-regressions.cjs",
    "check-rh-user.cjs",
    "check-rh-user.js",
    "check-test-database.js",
    "check-trigger-function.ts",
    "check-trigger-updated.ts",
    "check_login.js",
    "check_try_catch.cjs"
)

foreach ($script in $checkScripts) {
    $sourcePath = Join-Path $scriptsRoot $script
    Move-ScriptFile -Source $sourcePath -Destination $checksDir -Category "checks"
}

# ============================================================================
# FASE 2: SCRIPTS DE DEBUG
# ============================================================================
Write-Host "`n🐛 FASE 2: Organizando scripts de DEBUG" -ForegroundColor Magenta
Write-Host "----------------------------------------`n" -ForegroundColor Magenta

$debugDir = Join-Path $scriptsRoot "debug"
$debugScripts = @(
    "debug-cobranca.cjs",
    "debug-cobranca.js",
    "debug-cobranca2.js",
    "debug-pagamentos-contratante.js",
    "debug-rh-parcelas.ts",
    "debug_post_cadastro.js",
    "debug_print_lines.cjs",
    "debug_print_lines.js"
)

foreach ($script in $debugScripts) {
    $sourcePath = Join-Path $scriptsRoot $script
    Move-ScriptFile -Source $sourcePath -Destination $debugDir -Category "debug"
}

# ============================================================================
# FASE 3: SCRIPTS DE DIAGNÓSTICO
# ============================================================================
Write-Host "`n🔍 FASE 3: Organizando scripts de DIAGNÓSTICO" -ForegroundColor Magenta
Write-Host "----------------------------------------------`n" -ForegroundColor Magenta

$diagnosticsDir = Join-Path $scriptsRoot "diagnostics"
$diagnosticScripts = @(
    "diagnose-avaliacao.cjs",
    "diagnose-lote-alt.cjs",
    "diagnose-lote.cjs",
    "diagnose-lote.mts",
    "diagnose-sequence-deep.ts"
)

foreach ($script in $diagnosticScripts) {
    $sourcePath = Join-Path $scriptsRoot $script
    Move-ScriptFile -Source $sourcePath -Destination $diagnosticsDir -Category "diagnostics"
}

# ============================================================================
# FASE 4: SCRIPTS DE TEST
# ============================================================================
Write-Host "`n🧪 FASE 4: Organizando scripts de TEST" -ForegroundColor Magenta
Write-Host "---------------------------------------`n" -ForegroundColor Magenta

$testsDir = Join-Path $scriptsRoot "tests"
$testScripts = @(
    "test-cadastro-contratante.ts",
    "test-confirm-direct.ts",
    "test-confirm-pagamento3.ts",
    "test-conn.ts",
    "test-env-vars.ts",
    "test-findindex.cjs",
    "test-funcionario-query.ts",
    "test-laudo-download.mts",
    "test-login-gestor.ts",
    "test_create_contratante.js",
    "test_flow_api.js",
    "test_flow_api_multipart.js",
    "dev-test-cross-platform.js",
    "dev-test.bat"
)

foreach ($script in $testScripts) {
    $sourcePath = Join-Path $scriptsRoot $script
    Move-ScriptFile -Source $sourcePath -Destination $testsDir -Category "tests"
}

# ============================================================================
# FASE 5: ARQUIVOS TEMPORÁRIOS
# ============================================================================
Write-Host "`n🗑️  FASE 5: Organizando arquivos TEMPORÁRIOS" -ForegroundColor Magenta
Write-Host "--------------------------------------------`n" -ForegroundColor Magenta

$tempDir = Join-Path $scriptsRoot "temp"
$tempFiles = @(
    "temp_hash.ts"
)

foreach ($file in $tempFiles) {
    $sourcePath = Join-Path $scriptsRoot $file
    Move-ScriptFile -Source $sourcePath -Destination $tempDir -Category "temp"
}

# Arquivos temp em subdiretórios
$checksTemp = Join-Path $scriptsRoot "checks\list-contratantes-temp.js"
if (Test-Path $checksTemp) {
    Move-ScriptFile -Source $checksTemp -Destination $tempDir -Category "temp"
}

$fixesTemp = Join-Path $scriptsRoot "fixes\temp_create_login.sql"
if (Test-Path $fixesTemp) {
    Move-ScriptFile -Source $fixesTemp -Destination $tempDir -Category "temp"
}

# ============================================================================
# FASE 6: SCRIPTS DE MIGRAÇÃO
# ============================================================================
Write-Host "`n🔄 FASE 6: Organizando scripts de MIGRAÇÃO" -ForegroundColor Magenta
Write-Host "------------------------------------------`n" -ForegroundColor Magenta

$migrationsDir = Join-Path $scriptsRoot "migrations"
$migrationScripts = @(
    "apply-contratos-migration.js",
    "apply-fase-1-2-migrations.ps1",
    "apply-migration-072.mts",
    "apply-migration-091.ts",
    "apply-migration-092.ts",
    "apply-migration-093.ts",
    "apply-migration-095.ts",
    "apply-migration-200-neon.sql",
    "apply-migration-200-test-db.sql",
    "apply-migration-201-neon-simple.sql",
    "apply-migration-201-neon.sql",
    "apply-migrations-064-067.ps1",
    "apply-migrations-test-db.ps1",
    "apply-test-migrations-admin.js",
    "run-migration.mjs",
    "run-hash-migration.ts"
)

foreach ($script in $migrationScripts) {
    $sourcePath = Join-Path $scriptsRoot $script
    Move-ScriptFile -Source $sourcePath -Destination $migrationsDir -Category "migrations"
}

# ============================================================================
# FASE 7: SCRIPTS DE FIX/CORREÇÃO
# ============================================================================
Write-Host "`n🔧 FASE 7: Organizando scripts de FIX/CORREÇÃO" -ForegroundColor Magenta
Write-Host "-----------------------------------------------`n" -ForegroundColor Magenta

$fixesDir = Join-Path $scriptsRoot "fixes"
$fixScripts = @(
    "fix-allocator.ts",
    "fix-lotes-emitido-em.mts",
    "fix-lotes-sequence.ts",
    "fix-missing-laudo-columns.js",
    "force-fix-sequence.ts",
    "ultimate-fix-sequence.ts",
    "corrigir-lotes-clinica-rljcomercial.cjs"
)

foreach ($script in $fixScripts) {
    $sourcePath = Join-Path $scriptsRoot $script
    Move-ScriptFile -Source $sourcePath -Destination $fixesDir -Category "fixes"
}

# ============================================================================
# FASE 8: SCRIPTS DE BACKFILL
# ============================================================================
Write-Host "`n📦 FASE 8: Organizando scripts de BACKFILL" -ForegroundColor Magenta
Write-Host "------------------------------------------`n" -ForegroundColor Magenta

$backfillDir = Join-Path $scriptsRoot "backfill"
$backfillScripts = @(
    "backfill-laudos-hash.ts",
    "backfill-numero-funcionarios.js",
    "backfill-recibos-2025.mjs",
    "backfill-valor-pago-insert.js",
    "backfill-valor-pago.js"
)

foreach ($script in $backfillScripts) {
    $sourcePath = Join-Path $scriptsRoot $script
    Move-ScriptFile -Source $sourcePath -Destination $backfillDir -Category "backfill"
}

# ============================================================================
# FASE 9: SCRIPTS DE BATCH/LOTE
# ============================================================================
Write-Host "`n⚡ FASE 9: Organizando scripts de BATCH" -ForegroundColor Magenta
Write-Host "----------------------------------------`n" -ForegroundColor Magenta

$batchDir = Join-Path $scriptsRoot "batch"
$batchScripts = @(
    "batch-sync-laudos.ts",
    "recalcular-lotes.mjs",
    "sync-lote-allocator.ts"
)

foreach ($script in $batchScripts) {
    $sourcePath = Join-Path $scriptsRoot $script
    Move-ScriptFile -Source $sourcePath -Destination $batchDir -Category "batch"
}

# ============================================================================
# FASE 10: SCRIPTS SQL PARA DATABASE
# ============================================================================
Write-Host "`n🗄️  FASE 10: Organizando scripts SQL" -ForegroundColor Magenta
Write-Host "-------------------------------------`n" -ForegroundColor Magenta

$databaseSqlDir = Join-Path $scriptsRoot "database\sql"
$sqlScripts = @(
    "auto-refresh-triggers.sql",
    "clean-cnpj-cpf-data.sql",
    "clean-contratantes.sql",
    "corrigir-lotes-sem-fila-emissao.sql",
    "create-validar-sessao-rls-function.sql",
    "create_notify_triggers.sql",
    "db_create_audit_logs.sql",
    "db_create_pagamentos.sql",
    "db_fix_add_plano_columns.sql",
    "delete_aptos_emitidos.sql",
    "delete_contratante_41877277000184.sql",
    "diagnose-avaliacao-16841540069.sql",
    "diagnose-avaliacao-51-detailed.sql",
    "fix-avaliacao-48-status.sql",
    "fix-avaliacao-51-concluida.sql",
    "fix-avaliacao-51-status.sql",
    "fix-avaliacao-85-lote-25.sql",
    "fix-avaliacoes-completas-neon.sql",
    "fix-avaliacoes-completas.sql",
    "fix-todas-avaliacoes-lotes-neon.sql",
    "migrar-lotes-para-clinica-empresa.sql",
    "patch_gerar_numero_recibo.sql",
    "pre-migration-fixes.sql",
    "pre-migration-validation.sql",
    "reset-lotes-para-reemissao.sql",
    "reverter-lote-006-310126.sql",
    "reverter-lote-25-forcado.sql",
    "reverter-lote-25.sql",
    "search_cnpj.sql",
    "seed-admin-user.sql",
    "simulate_flow_41877277000184.sql",
    "simulate_flow_corrected_41877277000184.sql",
    "test-rh-solicitar-emissao.sql",
    "fix-all-avaliacoes-status-sistematico.sql"
)

foreach ($script in $sqlScripts) {
    $sourcePath = Join-Path $scriptsRoot $script
    Move-ScriptFile -Source $sourcePath -Destination $databaseSqlDir -Category "database/sql"
}

# ============================================================================
# FASE 11: OUTROS SCRIPTS DATABASE
# ============================================================================
Write-Host "`n🔐 FASE 11: Organizando outros scripts DATABASE" -ForegroundColor Magenta
Write-Host "------------------------------------------------`n" -ForegroundColor Magenta

$databaseDir = Join-Path $scriptsRoot "database"
$databaseScripts = @(
    "apply-security-function.mjs",
    "apply-security-fixes.ps1"
)

foreach ($script in $databaseScripts) {
    $sourcePath = Join-Path $scriptsRoot $script
    Move-ScriptFile -Source $sourcePath -Destination $databaseDir -Category "database"
}

# ============================================================================
# RESUMO FINAL
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 RESUMO DA HIGIENIZAÇÃO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "Modo: DRY RUN (simulação)" -ForegroundColor Yellow
} else {
    Write-Host "Modo: EXECUÇÃO REAL" -ForegroundColor Green
}

Write-Host "`nResultados:"
Write-Host "  ✅ Arquivos movidos: $movedCount" -ForegroundColor Green
Write-Host "  ⏭️  Arquivos pulados: $skippedCount" -ForegroundColor Yellow
Write-Host "  ❌ Erros: $($errors.Count)" -ForegroundColor Red

if ($errors.Count -gt 0) {
    Write-Host "`nErros encontrados:" -ForegroundColor Red
    foreach ($err in $errors) {
        Write-Host "  - $err" -ForegroundColor Red
    }
}

Write-Host "`n📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Revisar arquivos movidos nos diretórios de destino"
Write-Host "  2. Verificar se há imports quebrados"
Write-Host "  3. Testar scripts críticos"
Write-Host "  4. Atualizar README-ORGANIZACAO.md"
Write-Host "  5. Commit das mudanças"

if ($DryRun) {
    Write-Host "`n💡 Execute sem -DryRun para aplicar as mudanças" -ForegroundColor Yellow
}

Write-Host ""
