# Script para executar migrations corrigidas
# Execute com: .\aplicar-migrations-corrigidas.ps1

Write-Host "=== Aplicando Migrations Corrigidas ===" -ForegroundColor Cyan

# Configurar senha do PostgreSQL (mesma do setup-databases.ps1)
$env:PGPASSWORD = "123456"
$dbName = "nr-bps_db"

Write-Host "`n[1/3] Aplicando Migration 022 (RLS Contratacao - Corrigida)..." -ForegroundColor Yellow
$env:PGPASSWORD = "123456"
psql -U postgres -d $dbName -f "database/migrations/022_rls_contratacao_personalizada.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Migration 022 aplicada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Falha ao aplicar Migration 022" -ForegroundColor Red
    Write-Host "Código de saída: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/3] Limpando tabela notificacoes existente..." -ForegroundColor Yellow
$env:PGPASSWORD = "123456"
psql -U postgres -d $dbName -c "DROP TABLE IF EXISTS notificacoes CASCADE;"
$env:PGPASSWORD = "123456"
psql -U postgres -d $dbName -c "DROP VIEW IF EXISTS vw_notificacoes_dashboard CASCADE;"
$env:PGPASSWORD = "123456"
psql -U postgres -d $dbName -c "DROP VIEW IF EXISTS vw_notificacoes_nao_lidas CASCADE;"
$env:PGPASSWORD = "123456"
psql -U postgres -d $dbName -c "DROP FUNCTION IF EXISTS notificar_pre_cadastro_criado() CASCADE;"
$env:PGPASSWORD = "123456"
psql -U postgres -d $dbName -c "DROP FUNCTION IF EXISTS notificar_valor_definido() CASCADE;"
$env:PGPASSWORD = "123456"
psql -U postgres -d $dbName -c "DROP FUNCTION IF EXISTS marcar_notificacoes_lidas(INTEGER[], TEXT) CASCADE;"
$env:PGPASSWORD = "123456"
psql -U postgres -d $dbName -c "DROP FUNCTION IF EXISTS arquivar_notificacoes_antigas() CASCADE;"

Write-Host "`n[3/3] Aplicando Migration 023 (Sistema Notificacoes - Corrigida)..." -ForegroundColor Yellow
$env:PGPASSWORD = "123456"
psql -U postgres -d $dbName -f "database/migrations/023_sistema_notificacoes_fix.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Migration 023 aplicada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Falha ao aplicar Migration 023" -ForegroundColor Red
    Write-Host "Código de saída: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Verificando estrutura criada ===" -ForegroundColor Cyan
$env:PGPASSWORD = "123456"
psql -U postgres -d $dbName -c "\d notificacoes"
$env:PGPASSWORD = "123456"
psql -U postgres -d $dbName -c "\dv vw_notificacoes_*"

Write-Host "`n✅ Migrations corrigidas aplicadas com sucesso!" -ForegroundColor Green
Write-Host "Próximo passo: Aplicar Migration 024 (Prioridade Baixa)" -ForegroundColor Cyan
