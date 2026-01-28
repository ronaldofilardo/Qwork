# Script PowerShell para aplicar todas as migrations
# Executar no diretório raiz do projeto

$env:PGPASSWORD = "123456"
$database = "nr-bps_db"
$user = "postgres"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Aplicando Migrations 063.5-067" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

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
        Write-Host "ERRO ao aplicar $migration" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Concluído" -ForegroundColor Green
}

Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host "Validando instalação..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Testar views
Write-Host "`nTestando view vw_lotes_por_contratante..." -ForegroundColor Yellow
psql -U $user -d $database -c "SELECT COUNT(*) as total_registros FROM vw_lotes_por_contratante;"

# Testar função
Write-Host "`nTestando função current_user_contratante_id()..." -ForegroundColor Yellow
psql -U $user -d $database -c "SELECT current_user_contratante_id() IS NOT NULL OR current_user_contratante_id() IS NULL as funcao_ok;"

# Testar constraint de idempotência
Write-Host "`nValidando constraint de idempotência em laudos..." -ForegroundColor Yellow
psql -U $user -d $database -c "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'laudos' AND constraint_name = 'laudos_lote_id_unique';"

Write-Host "`n====================================" -ForegroundColor Green
Write-Host "Migrations aplicadas com sucesso!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

Remove-Item Env:\PGPASSWORD
