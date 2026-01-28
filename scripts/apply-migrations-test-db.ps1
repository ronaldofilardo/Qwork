# Script PowerShell para aplicar migrations no banco de TESTE
# Executar no diretório raiz do projeto

$env:PGPASSWORD = "123456"
$database = "nr-bps_db_test"
$user = "postgres"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Aplicando Migrations no BANCO DE TESTE" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Verificar se o banco de teste existe
Write-Host "`nVerificando banco de teste..." -ForegroundColor Yellow
$dbCheck = psql -U $user -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$database';"
if ($dbCheck -notmatch "1") {
    Write-Host "❌ Banco $database não existe!" -ForegroundColor Red
    Write-Host "Execute .\scripts\powershell\setup-databases.ps1 primeiro" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Banco $database existe" -ForegroundColor Green

# Aplicar migrations em sequência
$migrations = @(
    "database/migrations/apply_migrations_manual.sql",
    "database/migrations/064_fix_entidade_perfil_rls.sql",
    "database/migrations/065_laudo_idempotency.sql",
    "database/migrations/066_observability_views.sql",
    "database/migrations/067_audit_contratante_id.sql"
)

foreach ($migration in $migrations) {
    Write-Host "`nAplicando: $migration" -ForegroundColor Yellow
    psql -U $user -d $database -f $migration
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERRO ao aplicar $migration" -ForegroundColor Red
        Write-Host "Continuando com próxima migration..." -ForegroundColor Yellow
    } else {
        Write-Host "✓ Concluído" -ForegroundColor Green
    }
}

Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host "Validando instalação no banco de teste..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Testar views
Write-Host "`nTestando view vw_lotes_por_contratante..." -ForegroundColor Yellow
psql -U $user -d $database -c "SELECT COUNT(*) as total_registros FROM vw_lotes_por_contratante;"

# Testar função
Write-Host "`nTestando função current_user_contratante_id()..." -ForegroundColor Yellow
psql -U $user -d $database -c "SELECT current_user_contratante_id() IS NOT NULL OR current_user_contratante_id() IS NULL as funcao_ok;"

Write-Host "`n====================================" -ForegroundColor Green
Write-Host "Migrations aplicadas no banco de teste!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

Remove-Item Env:\PGPASSWORD
