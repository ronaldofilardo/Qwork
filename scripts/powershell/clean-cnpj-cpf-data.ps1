# Script PowerShell para limpar todos os CNPJs e CPFs do banco de dados QWork
# ATENÇÃO: Este script remove TODOS os dados de CNPJ/CPF do sistema
# Execute apenas em ambiente de desenvolvimento/teste
# Data: 2025-12-20

param(
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "nr-bps_db",

    [Parameter(Mandatory=$false)]
    [string]$SqlFile = "scripts\clean-cnpj-cpf-data.sql",

    [Parameter(Mandatory=$false)]
    [switch]$Force
)

# Verificar se está executando como administrador
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Este script deve ser executado como Administrador." -ForegroundColor Red
    Write-Host "Por favor, execute novamente com privilégios elevados." -ForegroundColor Yellow
    exit 1
}

# Verificar se o arquivo SQL existe
if (-not (Test-Path $SqlFile)) {
    Write-Host "Arquivo SQL não encontrado: $SqlFile" -ForegroundColor Red
    exit 1
}

# Verificar se o usuário realmente quer executar (a menos que -Force seja usado)
if (-not $Force) {
    Write-Host ""
    Write-Host "⚠️  ATENÇÃO: Este script irá remover TODOS os CNPJs e CPFs do banco de dados!" -ForegroundColor Red
    Write-Host "Isso inclui dados de tomadores, clínicas, empresas e funcionários." -ForegroundColor Red
    Write-Host ""
    $confirmation = Read-Host "Tem certeza que deseja continuar? Digite 'SIM' para confirmar"

    if ($confirmation -ne "SIM") {
        Write-Host "Operação cancelada pelo usuário." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Iniciando limpeza de CNPJs e CPFs do banco de dados..." -ForegroundColor Cyan

try {
    # Verificar se PostgreSQL está instalado e acessível
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if (-not $pgService) {
        Write-Host "PostgreSQL não parece estar instalado ou o serviço não está rodando." -ForegroundColor Red
        Write-Host "Verifique se PostgreSQL está instalado e o serviço está ativo." -ForegroundColor Yellow
        exit 1
    }

    # Executar o script SQL
    Write-Host "Executando script de limpeza..." -ForegroundColor Green

    $sqlCommand = Get-Content $SqlFile -Raw

    # Usar psql para executar o script
    $env:PGPASSWORD = "postgres"  # Assumindo senha padrão do desenvolvimento
    $result = $sqlCommand | psql -h localhost -U postgres -d $DatabaseName -v ON_ERROR_STOP=1

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ LIMPEZA CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
        Write-Host "Todos os CNPJs e CPFs foram removidos do banco de dados." -ForegroundColor Green
        Write-Host ""
        Write-Host "Próximos passos recomendados:" -ForegroundColor Cyan
        Write-Host "1. Verifique se o sistema ainda funciona corretamente" -ForegroundColor White
        Write-Host "2. Execute os testes para garantir que nada quebrou" -ForegroundColor White
        Write-Host "3. Se necessário, recarregue dados de teste sem CNPJ/CPF" -ForegroundColor White
    } else {
        Write-Host "❌ ERRO durante a execução do script SQL!" -ForegroundColor Red
        Write-Host "Código de saída: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Verifique os logs acima para detalhes do erro." -ForegroundColor Yellow
        exit 1
    }

} catch {
    Write-Host "❌ ERRO inesperado durante a execução:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    # Limpar variável de ambiente da senha
    if ($env:PGPASSWORD) {
        Remove-Item Env:PGPASSWORD
    }
}

Write-Host ""
Write-Host "Script finalizado." -ForegroundColor Cyan