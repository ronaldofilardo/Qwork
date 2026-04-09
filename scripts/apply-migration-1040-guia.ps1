#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Guia Interativo para Aplicar Migration 1040 em Staging/PROD

.DESCRIPTION
  Este script ajuda a aplicar a migration 1040 (reset_senha_tokens) em ambientes Neon
  de forma segura com validações em cada etapa.

.EXAMPLE
  .\apply-migration-1040-guia.ps1
#>

Write-Host "`n" -ForegroundColor Green
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Migration 1040 — Reset de Senha via Link (Admin → Perfis)   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

# =============================================================================
# PASSO 1: Verificar Pré-requisitos
# =============================================================================

Write-Host "✓ PASSO 1: Verificando Pré-requisitos" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────────────" -ForegroundColor Gray

$prereqOk = $true

# Verificar psql
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "  ✅ psql CLI instalado" -ForegroundColor Green
} else {
    Write-Host "  ❌ psql CLI NÃO encontrado" -ForegroundColor Red
    Write-Host "     Solução: Instalar PostgreSQL tools (https://www.postgresql.org/download/)" -ForegroundColor Yellow
    $prereqOk = $false
}

# Verificar arquivo migration
$migrationFile = "database/migrations/1040_reset_senha_tokens.sql"
if (Test-Path $migrationFile) {
    Write-Host "  ✅ Arquivo migration encontrado: $migrationFile" -ForegroundColor Green
} else {
    Write-Host "  ❌ Arquivo migration NÃO encontrado: $migrationFile" -ForegroundColor Red
    $prereqOk = $false
}

# Verificar script
$scriptFile = "scripts/apply-migration-1040-prod.ps1"
if (Test-Path $scriptFile) {
    Write-Host "  ✅ Script PowerShell encontrado: $scriptFile" -ForegroundColor Green
} else {
    Write-Host "  ❌ Script PowerShell NÃO encontrado: $scriptFile" -ForegroundColor Red
    $prereqOk = $false
}

if (-not $prereqOk) {
    Write-Host "`n❌ Pré-requisitos não satisfeitos. Abortando." -ForegroundColor Red
    exit 1
}

# =============================================================================
# PASSO 2: Coletar Credenciais
# =============================================================================

Write-Host "`n✓ PASSO 2: Coletando Credenciais Neon" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "  Você pode obter as URLs em: https://console.neon.tech" -ForegroundColor Cyan

$stagingUrl = Read-Host "`n  DATABASE_URL_STAGING"
$prodUrl = Read-Host "  DATABASE_URL_PROD"

if (-not $stagingUrl -or -not $prodUrl) {
    Write-Host "`n❌ URLs são obrigatórias. Abortando." -ForegroundColor Red
    exit 1
}

# Validar formato básico
if (-not ($stagingUrl -match "^postgresql://")) {
    Write-Host "❌ STAGING URL inválida (deve começar com 'postgresql://')" -ForegroundColor Red
    exit 1
}
if (-not ($prodUrl -match "^postgresql://")) {
    Write-Host "❌ PROD URL inválida (deve começar com 'postgresql://')" -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ URLs validadas" -ForegroundColor Green

# =============================================================================
# PASSO 3: Definir Variáveis de Ambiente
# =============================================================================

Write-Host "`n✓ PASSO 3: Configurando Variáveis de Ambiente" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────────────" -ForegroundColor Gray

$env:DATABASE_URL_STAGING = $stagingUrl
$env:DATABASE_URL_PROD = $prodUrl

Write-Host "  ✅ DATABASE_URL_STAGING configurada" -ForegroundColor Green
Write-Host "  ✅ DATABASE_URL_PROD configurada" -ForegroundColor Green

# =============================================================================
# PASSO 4: DRY-RUN (Simulação)
# =============================================================================

Write-Host "`n✓ PASSO 4: Executando DRY-RUN (Simulação)" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "  Nenhuma mudança será feita neste modo..." -ForegroundColor Cyan

Read-Host "  Pressione ENTER para continuar"

& ".\scripts\apply-migration-1040-prod.ps1" -DryRun

$dryRunOk = $LASTEXITCODE -eq 0

if ($dryRunOk) {
    Write-Host "  ✅ DRY-RUN passou sem erros" -ForegroundColor Green
} else {
    Write-Host "  ❌ DRY-RUN falhou. Abortando." -ForegroundColor Red
    exit 1
}

# =============================================================================
# PASSO 5: Confirmação Final
# =============================================================================

Write-Host "`n✓ PASSO 5: Confirmação Final" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "  ⚠️  Esta ação aplicará a migration 1040 em Staging E Prod" -ForegroundColor Yellow
Write-Host "      Credenciais serão usadas para: Neon Database Connection" -ForegroundColor Gray
Write-Host "`n"

$confirm = Read-Host "  Deseja prosseguir? (digite 'sim' para confirmar)"

if ($confirm -ne "sim") {
    Write-Host "  ❌ Operação cancelada." -ForegroundColor Red
    exit 0
}

# =============================================================================
# PASSO 6: EXECUÇÃO REAL
# =============================================================================

Write-Host "`n✓ PASSO 6: Aplicando Migration 1040" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────────────" -ForegroundColor Gray

& ".\scripts\apply-migration-1040-prod.ps1" -TargetEnv all

$execOk = $LASTEXITCODE -eq 0

# =============================================================================
# PASSO 7: Verificação Pós-Execução
# =============================================================================

Write-Host "`n✓ PASSO 7: Verificação Pós-Execução" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────────────" -ForegroundColor Gray

if ($execOk) {
    Write-Host "  ✅ Migration 1040 aplicada com sucesso!" -ForegroundColor Green
    Write-Host "`n  Você pode verificar em Neon com este SQL:" -ForegroundColor Cyan
    Write-Host "`n    SELECT column_name FROM information_schema.columns" -ForegroundColor Gray
    Write-Host "    WHERE table_name = 'usuarios'" -ForegroundColor Gray
    Write-Host "    AND column_name LIKE 'reset_%'" -ForegroundColor Gray
    Write-Host "    ORDER BY ordinal_position;" -ForegroundColor Gray
    Write-Host "`n  Colunas esperadas:" -ForegroundColor Cyan
    Write-Host "    • reset_token" -ForegroundColor Gray
    Write-Host "    • reset_token_expira_em" -ForegroundColor Gray
    Write-Host "    • reset_tentativas_falhas" -ForegroundColor Gray
    Write-Host "    • reset_usado_em" -ForegroundColor Gray
} else {
    Write-Host "  ❌ Migration 1040 FALHOU em um ou mais ambientes" -ForegroundColor Red
    Write-Host "     Verifique as mensagens de erro acima" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✅ PROCESSO CONCLUÍDO COM SUCESSO                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host "`n"
