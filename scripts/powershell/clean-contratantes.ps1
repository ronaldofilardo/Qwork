# ==========================================
# SCRIPT POWERSHELL: LIMPAR CONTRATANTES
# Data: 2025-12-22
# Objetivo: Executar limpeza completa de contratantes no banco nr-bps_db
# ==========================================

param(
    [string]$DatabaseServer = "localhost",
    [string]$DatabaseName = "nr-bps_db",
    [string]$Username = "postgres",
    [string]$Password = "123456",
    [string]$SqlFile = "scripts/clean-contratantes.sql"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "LIMPEZA COMPLETA DE CONTRATANTES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo SQL existe
if (-not (Test-Path $SqlFile)) {
    Write-Host "❌ ERRO: Arquivo SQL não encontrado: $SqlFile" -ForegroundColor Red
    exit 1
}

# Construir connection string
$ConnectionString = "Host=$DatabaseServer;Database=$DatabaseName;Username=$Username;Password=$Password;"

Write-Host "📋 Configurações:" -ForegroundColor Yellow
Write-Host "   Servidor: $DatabaseServer" -ForegroundColor Yellow
Write-Host "   Banco: $DatabaseName" -ForegroundColor Yellow
Write-Host "   Usuário: $Username" -ForegroundColor Yellow
Write-Host "   Arquivo SQL: $SqlFile" -ForegroundColor Yellow
Write-Host ""

# Confirmar execução
$confirm = Read-Host "⚠️  ATENÇÃO: Este script irá REMOVER TODOS os contratantes do banco!`nDeseja continuar? (s/N)"
if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "❌ Operação cancelada pelo usuário." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔄 Executando limpeza..." -ForegroundColor Green

try {
    # Executar o script SQL
    $result = & psql $ConnectionString -f $SqlFile -q

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ LIMPEZA CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Verifique o log acima para confirmar as quantidades removidas." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🔄 Sequences foram resetadas para começar do ID 1." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  IMPORTANTE: Faça backup dos dados antes de executar em produção!" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "❌ ERRO durante a execução do script SQL!" -ForegroundColor Red
        Write-Host "Código de saída: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host ""
    Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SCRIPT FINALIZADO" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan