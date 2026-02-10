# Script PowerShell: Aplicar Correção Urgente em PROD
# Data: 10/02/2026
# Objetivo: Corrigir função prevent_mutation_during_emission() que causa erro ao inativar avaliações

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  CORREÇÃO URGENTE: prevent_mutation_during_emission" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se existe .env.production.local
if (Test-Path ".env.production.local") {
    Write-Host "✓ Arquivo .env.production.local encontrado" -ForegroundColor Green
    
    # Carregar DATABASE_URL
    Get-Content .env.production.local | ForEach-Object {
        if ($_ -match '^DATABASE_URL=(.+)$') {
            $dbUrl = $matches[1]
            Write-Host "✓ DATABASE_URL carregada" -ForegroundColor Green
        }
    }
} else {
    Write-Host "❌ .env.production.local não encontrado" -ForegroundColor Red
    Write-Host "   Crie o arquivo com DATABASE_URL de produção" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "ATENÇÃO: Esta correção será aplicada em PRODUÇÃO!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Problema identificado:" -ForegroundColor Cyan
Write-Host "  - Função prevent_mutation_during_emission() referencia coluna processamento_em"
Write-Host "  - Coluna foi removida na migration 130"
Write-Host "  - Erro ao inativar avaliações: 'column processamento_em does not exist'"
Write-Host ""
Write-Host "Solução:" -ForegroundColor Cyan
Write-Host "  - Aplicar migration 1009_fix_prevent_mutation_function_prod.sql"
Write-Host "  - Remove referência a processamento_em da função"
Write-Host "  - Mantém lógica de proteção de avaliações"
Write-Host ""

$confirmation = Read-Host "Deseja continuar? (Digite 'SIM' para confirmar)"

if ($confirmation -ne "SIM") {
    Write-Host "❌ Operação cancelada pelo usuário" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "PASSO 1: Executando diagnóstico..." -ForegroundColor Cyan
Write-Host ""

# Executar diagnóstico primeiro
psql $dbUrl -f scripts/diagnostico-prevent-mutation-function.sql

Write-Host ""
Write-Host "PASSO 2: Aplicando correção..." -ForegroundColor Cyan
Write-Host ""

# Aplicar migração de correção
$result = psql $dbUrl -f database/migrations/1009_fix_prevent_mutation_function_prod.sql 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Correção aplicada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "PASSO 3: Executando diagnóstico pós-correção..." -ForegroundColor Cyan
    Write-Host ""
    
    # Executar diagnóstico novamente para confirmar
    psql $dbUrl -f scripts/diagnostico-prevent-mutation-function.sql
    
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "  CORREÇÃO CONCLUÍDA" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Testar rota /api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/inativar"
    Write-Host "  2. Testar rota /api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar"
    Write-Host "  3. Verificar logs de produção para confirmar ausência de erros"
    Write-Host ""
    Write-Host "Se o erro persistir, executar:" -ForegroundColor Yellow
    Write-Host "  psql `$dbUrl -c ""SELECT pg_get_functiondef('prevent_mutation_during_emission'::regproc);"""
    Write-Host ""
    
} else {
    Write-Host "❌ Erro ao aplicar correção!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Saída do erro:" -ForegroundColor Red
    Write-Host $result
    Write-Host ""
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "  - Permissão insuficiente no banco"
    Write-Host "  - Sintaxe SQL incompatível"
    Write-Host "  - Função não existe"
    Write-Host ""
    Write-Host "Para rollback manual, executar:" -ForegroundColor Yellow
    Write-Host "  DROP FUNCTION IF EXISTS prevent_mutation_during_emission() CASCADE;"
    Write-Host ""
    exit 1
}
