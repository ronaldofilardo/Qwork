#!/usr/bin/env pwsh
# Script para aplicar correções de cadastro de contratantes
# Executa migrations 003 e 004

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  APLICAR CORREÇÕES - CADASTRO CONTRATANTES " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está executando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  AVISO: Execute como Administrador para garantir permissões completas" -ForegroundColor Yellow
    Write-Host ""
}

# Determinar banco de dados baseado no ambiente
$dbName = "nr-bps_db"  # Desenvolvimento
if ($env:NODE_ENV -eq "test") {
    $dbName = "nr-bps_db_test"
    Write-Host "🧪 Modo TESTE detectado - usando banco: $dbName" -ForegroundColor Yellow
} else {
    Write-Host "🔧 Modo DESENVOLVIMENTO - usando banco: $dbName" -ForegroundColor Green
}

# Verificar se PostgreSQL está rodando
Write-Host "📡 Verificando serviço PostgreSQL..." -ForegroundColor Cyan
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if (-not $pgService) {
    Write-Host "❌ Serviço PostgreSQL não encontrado!" -ForegroundColor Red
    Write-Host "   Certifique-se de que o PostgreSQL está instalado e rodando." -ForegroundColor Yellow
    exit 1
}

if ($pgService.Status -ne "Running") {
    Write-Host "⚠️  PostgreSQL não está rodando. Iniciando..." -ForegroundColor Yellow
    Start-Service $pgService.Name
    Start-Sleep -Seconds 2
}

Write-Host "✅ PostgreSQL está rodando" -ForegroundColor Green
Write-Host ""

# Verificar se banco existe
Write-Host "🔍 Verificando banco de dados $dbName..." -ForegroundColor Cyan
$checkDb = psql -U postgres -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$dbName';" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao conectar no PostgreSQL" -ForegroundColor Red
    Write-Host $checkDb
    exit 1
}

if (-not $checkDb.Trim()) {
    Write-Host "❌ Banco de dados '$dbName' não existe!" -ForegroundColor Red
    Write-Host "   Execute o script de setup primeiro: .\scripts\powershell\setup-databases.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Banco de dados encontrado" -ForegroundColor Green
Write-Host ""

# Arquivos de migration
$migration003 = "database\migration-003-correcoes-cadastro.sql"
$migration004 = "database\migration-004-rls-contratacao.sql"

# Verificar se arquivos existem
if (-not (Test-Path $migration003)) {
    Write-Host "❌ Arquivo não encontrado: $migration003" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $migration004)) {
    Write-Host "❌ Arquivo não encontrado: $migration004" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivos de migration encontrados" -ForegroundColor Green
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 MODO DRY-RUN - Apenas mostrando o que seria executado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Seria executado:" -ForegroundColor Cyan
    Write-Host "  1. $migration003" -ForegroundColor White
    Write-Host "  2. $migration004" -ForegroundColor White
    Write-Host ""
    exit 0
}

# Executar Migration 003
Write-Host "📝 Executando Migration 003 - Correções de Schema..." -ForegroundColor Cyan
Write-Host "   - Adicionar status ao ENUM" -ForegroundColor Gray
Write-Host "   - Adicionar colunas contrato_id e plano_tipo em contratantes" -ForegroundColor Gray
Write-Host "   - Adicionar colunas em contratos (valor_personalizado, metadados)" -ForegroundColor Gray
Write-Host "   - Criar função criar_senha_inicial_entidade()" -ForegroundColor Gray
Write-Host "   - Criar trigger sync_contratante_plano_tipo" -ForegroundColor Gray
Write-Host ""

$result003 = psql -U postgres -d $dbName -f $migration003 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao executar Migration 003" -ForegroundColor Red
    if ($Verbose) {
        Write-Host $result003 -ForegroundColor Red
    }
    exit 1
}

Write-Host "✅ Migration 003 aplicada com sucesso" -ForegroundColor Green
if ($Verbose) {
    Write-Host $result003 -ForegroundColor Gray
}
Write-Host ""

# Executar Migration 004
Write-Host "📝 Executando Migration 004 - RLS (Row Level Security)..." -ForegroundColor Cyan
Write-Host "   - Habilitar RLS em contratantes e contratos" -ForegroundColor Gray
Write-Host "   - Criar policies para admin, gestor_entidade e rh" -ForegroundColor Gray
Write-Host "   - Criar função pode_acessar_contratante()" -ForegroundColor Gray
Write-Host ""

$result004 = psql -U postgres -d $dbName -f $migration004 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao executar Migration 004" -ForegroundColor Red
    if ($Verbose) {
        Write-Host $result004 -ForegroundColor Red
    }
    exit 1
}

Write-Host "✅ Migration 004 aplicada com sucesso" -ForegroundColor Green
if ($Verbose) {
    Write-Host $result004 -ForegroundColor Gray
}
Write-Host ""

# Validações pós-migration
Write-Host "🔍 Validando alterações..." -ForegroundColor Cyan

# Verificar ENUM
$checkEnum = psql -U postgres -d $dbName -t -c "SELECT unnest(enum_range(NULL::status_aprovacao_enum))::text;" 2>&1
if ($checkEnum -match "aguardando_pagamento") {
    Write-Host "✅ ENUM status_aprovacao_enum atualizado" -ForegroundColor Green
} else {
    Write-Host "⚠️  ENUM pode não ter sido atualizado corretamente" -ForegroundColor Yellow
}

# Verificar colunas
$checkColumns = psql -U postgres -d $dbName -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'contratantes' AND column_name IN ('contrato_id', 'plano_tipo');" 2>&1
if ($checkColumns -match "contrato_id" -and $checkColumns -match "plano_tipo") {
    Write-Host "✅ Colunas adicionadas em contratantes" -ForegroundColor Green
} else {
    Write-Host "⚠️  Colunas podem não ter sido criadas corretamente" -ForegroundColor Yellow
}

# Verificar função
$checkFunction = psql -U postgres -d $dbName -t -c "SELECT proname FROM pg_proc WHERE proname = 'criar_senha_inicial_entidade';" 2>&1
if ($checkFunction -match "criar_senha_inicial_entidade") {
    Write-Host "✅ Função criar_senha_inicial_entidade() criada" -ForegroundColor Green
} else {
    Write-Host "⚠️  Função pode não ter sido criada" -ForegroundColor Yellow
}

# Verificar RLS
$checkRLS = psql -U postgres -d $dbName -t -c "SELECT relname FROM pg_class WHERE relname IN ('contratantes', 'contratos') AND relrowsecurity = true;" 2>&1
if ($checkRLS -match "contratantes" -and $checkRLS -match "contratos") {
    Write-Host "✅ RLS habilitado em contratantes e contratos" -ForegroundColor Green
} else {
    Write-Host "⚠️  RLS pode não ter sido habilitado corretamente" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  ✅ MIGRATIONS APLICADAS COM SUCESSO!     " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Execute os testes: pnpm test -- cadastro-contratante" -ForegroundColor White
Write-Host "  2. Verifique os logs do sistema" -ForegroundColor White
Write-Host "  3. Teste o fluxo de cadastro manualmente" -ForegroundColor White
Write-Host ""
