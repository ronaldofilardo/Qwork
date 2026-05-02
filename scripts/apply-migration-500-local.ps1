# =====================================================================
# Script para aplicar Migration 500 no banco LOCAL PostgreSQL
# =====================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "====================================================================="  -ForegroundColor Cyan
Write-Host " MIGRAÇÃO 500: SEGREGAÇÃO DE FOREIGN KEYS"  -ForegroundColor Cyan
Write-Host " Entidades vs Clínicas - Arquitetura Segregada"  -ForegroundColor Cyan
Write-Host " BANCO LOCAL: nr-bps_db @ localhost"  -ForegroundColor Cyan
Write-Host "====================================================================="  -ForegroundColor Cyan
Write-Host ""

# Caminho do arquivo de migração
$migrationFile = ".\database\migrations\500_segregar_fks_entidades_clinicas.sql"

# Verificar se o arquivo existe
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Erro: Arquivo de migração não encontrado: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Arquivo de migração encontrado" -ForegroundColor Green
Write-Host ""

# Configurações do banco LOCAL
$env:PGHOST = "localhost"
$env:PGDATABASE = "nr-bps_db"
$env:PGUSER = "postgres"
$env:PGPASSWORD = if ($env:LOCAL_DB_PASSWORD) { $env:LOCAL_DB_PASSWORD } else { "postgres" }
$env:PGPORT = "5432"

Write-Host "🔌 Configuração do banco:" -ForegroundColor Yellow
Write-Host "   Host: localhost"
Write-Host "   Database: nr-bps_db"
Write-Host "   User: postgres"
Write-Host "   Port: 5432"
Write-Host ""

# Confirmação
Write-Host "⚠ ATENÇÃO: Esta migração irá:" -ForegroundColor Yellow
Write-Host "  1. Dropar RLS policies que dependem de contratante_id"
Write-Host "  2. Adicionar colunas entidade_id e/ou clinica_id em várias tabelas"
Write-Host "  3. Remover todas as colunas contratante_id"
Write-Host "  4. Atualizar constraints e foreign keys"
Write-Host "  5. Criar novos indexes"
Write-Host ""

$confirm = Read-Host "Deseja continuar? (s/N)"
if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "❌ Migração cancelada pelo usuário" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Executando migração..." -ForegroundColor Green
Write-Host ""

try {
    # Executar a migração usando psql
    $psqlPath = "psql"
    
    # Testar se psql está disponível
    try {
        & $psqlPath --version | Out-Null
    } catch {
        Write-Host "❌ Erro: psql não encontrado no PATH" -ForegroundColor Red
        Write-Host "   Certifique-se de que o PostgreSQL está instalado e no PATH" -ForegroundColor Yellow
        exit 1
    }

    # Executar migração
    & $psqlPath -h localhost -U postgres -d nr-bps_db -f $migrationFile

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "====================================================================="  -ForegroundColor Green
        Write-Host " ✅ MIGRAÇÃO 500 CONCLUÍDA COM SUCESSO!"  -ForegroundColor Green
        Write-Host "====================================================================="  -ForegroundColor Green
        Write-Host ""
        Write-Host "Próximos passos:"
        Write-Host "  1. Revisar o output acima para verificar avisos"
        Write-Host "  2. Recriar RLS policies usando entidade_id/clinica_id"
        Write-Host "  3. Atualizar código TypeScript (APIs e tipos)"
        Write-Host "  4. Executar: npm run build"
        Write-Host "  5. Executar: npm run test"
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Migração falhou com código de saída: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "   Revise os erros acima" -ForegroundColor Yellow
        exit $LASTEXITCODE
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao executar migração: $_" -ForegroundColor Red
    exit 1
}
