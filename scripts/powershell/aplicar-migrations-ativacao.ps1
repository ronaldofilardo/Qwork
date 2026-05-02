# Script para aplicar migrations de ativação e tokens
# Executa as migrations 004 e 005 no banco de dados local

$ErrorActionPreference = "Stop"

Write-Host "🚀 Aplicando Migrations de Ativação e Tokens" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$DB_USER = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "nr-bps_db"
$MIGRATIONS_DIR = "database\migrations"

# Verificar se psql está disponível
try {
    $null = Get-Command psql -ErrorAction Stop
} catch {
    Write-Host "❌ ERRO: psql não encontrado no PATH" -ForegroundColor Red
    Write-Host "   Instale o PostgreSQL ou adicione ao PATH" -ForegroundColor Yellow
    exit 1
}

# Verificar se arquivos de migration existem
$migration004 = Join-Path $MIGRATIONS_DIR "migration-004-constraints-ativacao.sql"
$migration005 = Join-Path $MIGRATIONS_DIR "migration-005-tokens-retomada.sql"

if (-not (Test-Path $migration004)) {
    Write-Host "❌ ERRO: Arquivo não encontrado: $migration004" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $migration005)) {
    Write-Host "❌ ERRO: Arquivo não encontrado: $migration005" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivos de migration encontrados" -ForegroundColor Green
Write-Host ""

# Aplicar Migration 004 - Constraints de Ativação
Write-Host "📋 Aplicando Migration 004: Constraints de Ativação" -ForegroundColor Cyan
Write-Host "   - Constraint chk_ativa_exige_pagamento" -ForegroundColor Gray
Write-Host "   - Tabela alertas_integridade" -ForegroundColor Gray
Write-Host "   - Triggers de validação" -ForegroundColor Gray
Write-Host "   - Correção automática de inconsistências" -ForegroundColor Gray
Write-Host ""

$env:PGPASSWORD = if ($env:LOCAL_DB_PASSWORD) { $env:LOCAL_DB_PASSWORD } else { "postgres" }

try {
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f $migration004
    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao executar migration-004"
    }
    Write-Host "✅ Migration 004 aplicada com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO ao aplicar Migration 004: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item Env:\PGPASSWORD
}

Write-Host ""

# Aplicar Migration 005 - Tokens de Retomada
Write-Host "📋 Aplicando Migration 005: Tokens de Retomada" -ForegroundColor Cyan
Write-Host "   - Tabela tokens_retomada_pagamento" -ForegroundColor Gray
Write-Host "   - Funções de validação de token" -ForegroundColor Gray
Write-Host "   - Views de auditoria" -ForegroundColor Gray
Write-Host ""

$env:PGPASSWORD = if ($env:LOCAL_DB_PASSWORD) { $env:LOCAL_DB_PASSWORD } else { "postgres" }

try {
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f $migration005
    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao executar migration-005"
    }
    Write-Host "✅ Migration 005 aplicada com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO ao aplicar Migration 005: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item Env:\PGPASSWORD
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✅ TODAS AS MIGRATIONS APLICADAS COM SUCESSO" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar integridade pós-migration
Write-Host "🔍 Verificando integridade do banco..." -ForegroundColor Cyan
$env:PGPASSWORD = if ($env:LOCAL_DB_PASSWORD) { $env:LOCAL_DB_PASSWORD } else { "postgres" }

try {
    $query = @"
SELECT 
  'tomadores válidos' as tipo,
  COUNT(*) as total
FROM tomadores
WHERE ativa = true AND pagamento_confirmado = true

UNION ALL

SELECT 
  'Inconsistências' as tipo,
  COUNT(*) as total
FROM vw_tomadores_inconsistentes;
"@

    $result = psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -A -c $query
    Write-Host ""
    Write-Host "Resultado da verificação:" -ForegroundColor Yellow
    Write-Host $result -ForegroundColor White
} catch {
    Write-Host "⚠️  Aviso: Não foi possível verificar integridade" -ForegroundColor Yellow
} finally {
    Remove-Item Env:\PGPASSWORD
}

Write-Host ""
Write-Host "📚 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Execute: pnpm test __tests__/e2e/fluxo-pagamento-completo.test.ts" -ForegroundColor Gray
Write-Host "   2. Agende cron diário: pnpm reconciliar:contratos" -ForegroundColor Gray
Write-Host "   3. Revise documentação: docs/fluxo-pagamento.md" -ForegroundColor Gray
Write-Host ""
