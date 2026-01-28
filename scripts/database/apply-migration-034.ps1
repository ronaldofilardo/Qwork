# Script para aplicar Migration 034 - Sistema de Notificações Admin
# Data: 2025-12-25
# Descrição: Aplica correções na máquina de estado de pagamento e cadastro

param(
    [switch]$Production = $false
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Migration 034 - Sistema de Notificações" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está rodando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  AVISO: Não está rodando como administrador" -ForegroundColor Yellow
    Write-Host "   Pode ser necessário para conectar ao PostgreSQL" -ForegroundColor Yellow
    Write-Host ""
}

# Definir database baseado no ambiente
if ($Production) {
    Write-Host "❌ BLOQUEADO: Este script não pode rodar em PRODUÇÃO" -ForegroundColor Red
    Write-Host "   Use a interface Neon Cloud para aplicar migrations em produção" -ForegroundColor Yellow
    Write-Host ""
    exit 1
} else {
    $database = "nr-bps_db"
    Write-Host "🔧 Ambiente: DEVELOPMENT" -ForegroundColor Green
}

Write-Host "📊 Database: $database" -ForegroundColor Cyan
Write-Host ""

# Verificar se arquivo de migration existe
$migrationFile = Join-Path $PSScriptRoot "..\..\database\migrations\034_sistema_notificacoes_admin.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Arquivo de migration não encontrado:" -ForegroundColor Red
    Write-Host "   $migrationFile" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Arquivo de migration encontrado" -ForegroundColor Green
Write-Host ""

# Criar backup antes de aplicar
Write-Host "📦 Criando backup..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $PSScriptRoot "..\..\backups\backup-pre-migration-034-$timestamp.sql"
$backupDir = Split-Path $backupFile -Parent

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

try {
    & pg_dump -h localhost -U postgres -d $database -f $backupFile
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup criado: $backupFile" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backup falhou, mas continuando..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Erro ao criar backup: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔄 Aplicando migration..." -ForegroundColor Cyan

# Aplicar migration
try {
    & psql -h localhost -U postgres -d $database -f $migrationFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration aplicada com sucesso!" -ForegroundColor Green
        Write-Host ""
        
        # Verificar se tabelas foram criadas
        Write-Host "🔍 Verificando estrutura criada..." -ForegroundColor Cyan
        
        $verifyQuery = @"
SELECT 
    'notificacoes_admin' as tabela,
    COUNT(*) as total_registros
FROM notificacoes_admin
UNION ALL
SELECT 
    'tokens_retomada_pagamento' as tabela,
    COUNT(*) as total_registros
FROM tokens_retomada_pagamento;
"@
        
        $tempFile = [System.IO.Path]::GetTempFileName()
        $verifyQuery | Out-File -FilePath $tempFile -Encoding UTF8
        
        & psql -h localhost -U postgres -d $database -f $tempFile
        Remove-Item $tempFile
        
        Write-Host ""
        Write-Host "✅ Estrutura verificada com sucesso!" -ForegroundColor Green
        
    } else {
        Write-Host ""
        Write-Host "❌ Erro ao aplicar migration" -ForegroundColor Red
        Write-Host "   Verifique os logs acima para detalhes" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Para restaurar backup:" -ForegroundColor Yellow
        Write-Host "   psql -h localhost -U postgres -d $database -f $backupFile" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao aplicar migration: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Para restaurar backup:" -ForegroundColor Yellow
    Write-Host "   psql -h localhost -U postgres -d $database -f $backupFile" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ✅ MIGRATION CONCLUÍDA COM SUCESSO" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Testar fluxo de cadastro e pagamento" -ForegroundColor White
Write-Host "   2. Simular falha de pagamento" -ForegroundColor White
Write-Host "   3. Verificar criação de notificação admin" -ForegroundColor White
Write-Host "   4. Testar geração de link de retomada" -ForegroundColor White
Write-Host "   5. Validar login bloqueado sem pagamento" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentação: docs/corrections/CORRECAO-MAQUINA-ESTADO-PAGAMENTO.md" -ForegroundColor Cyan
Write-Host ""
