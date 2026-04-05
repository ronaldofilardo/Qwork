# ====================================================================
# Script: Aplicar Migrations 410 e 420
# ====================================================================
# Este script aplica as migrations de enforcement e rename aos bancos
# de dados de desenvolvimento e teste.
#
# IMPORTANTE: Execute este script manualmente após revisar as migrations!
# ====================================================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "APLICANDO MIGRATIONS 410 e 420" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Definir variáveis
$MIGRATIONS_DIR = "database/migrations"
$MIG_410 = "$MIGRATIONS_DIR/410_enforce_usuarios_only_for_accounts.sql"
$MIG_420 = "$MIGRATIONS_DIR/420_rename_tomadores_to_entidades.sql"
$DB_DEV = "nr-bps_db"
$DB_TEST = "nr-bps_db_test"
$DB_USER = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"

Write-Host "Migrations a serem aplicadas:" -ForegroundColor Yellow
Write-Host "  1. Migration 410: Enforce usuarios-only para contas" -ForegroundColor White
Write-Host "  2. Migration 420: Rename tomadores → entidades" -ForegroundColor White
Write-Host ""

# Função para aplicar migration
function Apply-Migration {
    param(
        [string]$MigrationFile,
        [string]$Database,
        [string]$MigrationName
    )
    
    Write-Host "-------------------------------------------" -ForegroundColor Gray
    Write-Host "Aplicando: $MigrationName" -ForegroundColor Cyan
    Write-Host "Database: $Database" -ForegroundColor Cyan
    Write-Host "-------------------------------------------" -ForegroundColor Gray
    
    try {
        $result = & psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $Database -f $MigrationFile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Migration aplicada com sucesso!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Saída:" -ForegroundColor Gray
            Write-Host $result -ForegroundColor White
        } else {
            Write-Host "✗ Erro ao aplicar migration!" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ Exceção ao executar psql: $_" -ForegroundColor Red
        return $false
    }
    
    Write-Host ""
    return $true
}

# ====================================================================
# MIGRATION 410: Enforce usuarios-only
# ====================================================================

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "PARTE 1: MIGRATION 410 (Enforce usuarios-only)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Aplicando em $DB_DEV..." -ForegroundColor Yellow
$success = Apply-Migration -MigrationFile $MIG_410 -Database $DB_DEV -MigrationName "Migration 410"

if (-not $success) {
    Write-Host "ERRO: Migration 410 falhou em $DB_DEV. Abortando." -ForegroundColor Red
    exit 1
}

Write-Host "Aplicando em $DB_TEST..." -ForegroundColor Yellow
$success = Apply-Migration -MigrationFile $MIG_410 -Database $DB_TEST -MigrationName "Migration 410"

if (-not $success) {
    Write-Host "AVISO: Migration 410 falhou em $DB_TEST. Revise manualmente." -ForegroundColor Yellow
}

# ====================================================================
# MIGRATION 420: Rename tomadores → entidades
# ====================================================================

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "PARTE 2: MIGRATION 420 (Rename tomadores)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Aplicando em $DB_DEV..." -ForegroundColor Yellow
$success = Apply-Migration -MigrationFile $MIG_420 -Database $DB_DEV -MigrationName "Migration 420"

if (-not $success) {
    Write-Host "ERRO: Migration 420 falhou em $DB_DEV. Abortando." -ForegroundColor Red
    exit 1
}

Write-Host "Aplicando em $DB_TEST..." -ForegroundColor Yellow
$success = Apply-Migration -MigrationFile $MIG_420 -Database $DB_TEST -MigrationName "Migration 420"

if (-not $success) {
    Write-Host "AVISO: Migration 420 falhou em $DB_TEST. Revise manualmente." -ForegroundColor Yellow
}

# ====================================================================
# FINALIZAÇÃO
# ====================================================================

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "MIGRATIONS APLICADAS COM SUCESSO!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Revisar saída das migrations acima" -ForegroundColor White
Write-Host "  2. Executar testes específicos (ver CHECKLIST_TESTES.md)" -ForegroundColor White
Write-Host "  3. Validar aplicação e código atualizado" -ForegroundColor White
Write-Host ""
Write-Host "Arquivos a serem revisados:" -ForegroundColor Yellow
Write-Host "  - database/migrations/410_enforce_usuarios_only_for_accounts.sql" -ForegroundColor White
Write-Host "  - database/migrations/420_rename_tomadores_to_entidades.sql" -ForegroundColor White
Write-Host ""
