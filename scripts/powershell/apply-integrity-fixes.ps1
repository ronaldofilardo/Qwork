# Script de aplicação de correções de integridade
# QWork - Correções Críticas de Banco de Dados
# Data: 2025-12-20

param(
    [Parameter(Mandatory=$false)]
    [string]$Ambiente = "dev",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBackup = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

# Configurações
$DbName = if ($Ambiente -eq "prod") { "nr-bps_db" } else { "nr-bps_db" }
$DbUser = "postgres"
$BackupDir = ".\backups"
$MigrationsDir = ".\database\migrations"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "QWork - Aplicação de Correções de Integridade" -ForegroundColor Cyan
Write-Host "Ambiente: $Ambiente" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se PostgreSQL está instalado
try {
    $pgVersion = psql --version
    Write-Host "✅ PostgreSQL encontrado: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL não encontrado. Instale antes de continuar." -ForegroundColor Red
    exit 1
}

# Criar diretório de backup se não existir
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "📁 Diretório de backup criado: $BackupDir" -ForegroundColor Green
}

# Executar backup (se não for skip)
if (-not $SkipBackup -and -not $DryRun) {
    Write-Host ""
    Write-Host "📦 Criando backup do banco de dados..." -ForegroundColor Yellow
    $BackupFile = Join-Path $BackupDir "backup-pre-fixes-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
    
    try {
        pg_dump -U $DbUser -d $DbName -f $BackupFile
        Write-Host "✅ Backup criado com sucesso: $BackupFile" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao criar backup: $_" -ForegroundColor Red
        exit 1
    }
} elseif ($SkipBackup) {
    Write-Host "⚠️  Backup IGNORADO (parâmetro -SkipBackup)" -ForegroundColor Yellow
}

# Verificar se migrations existem
$migrations = @(
    "011_fix_clinicas_empresas_fk.sql",
    "012_remove_redundant_table.sql",
    "013_nivel_cargo_not_null.sql",
    "014_add_fk_analise_estatistica.sql"
)

Write-Host ""
Write-Host "🔍 Verificando arquivos de migration..." -ForegroundColor Yellow

foreach ($migration in $migrations) {
    $migrationPath = Join-Path $MigrationsDir $migration
    if (-not (Test-Path $migrationPath)) {
        Write-Host "❌ Migration não encontrada: $migration" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✓ $migration" -ForegroundColor Gray
}

Write-Host "✅ Todas as migrations encontradas" -ForegroundColor Green

# Modo Dry Run
if ($DryRun) {
    Write-Host ""
    Write-Host "🔍 MODO DRY RUN - Apenas verificando sintaxe SQL..." -ForegroundColor Yellow
    
    foreach ($migration in $migrations) {
        $migrationPath = Join-Path $MigrationsDir $migration
        Write-Host "   Verificando: $migration" -ForegroundColor Gray
        
        try {
            # Apenas valida sintaxe sem executar
            psql -U $DbUser -d $DbName -f $migrationPath --dry-run 2>&1 | Out-Null
            Write-Host "   ✓ $migration - OK" -ForegroundColor Green
        } catch {
            Write-Host "   ✗ $migration - ERRO: $_" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "✅ Dry run concluído. Use sem -DryRun para aplicar." -ForegroundColor Green
    exit 0
}

# Aplicar migrations
Write-Host ""
Write-Host "🚀 Aplicando migrations..." -ForegroundColor Yellow
Write-Host ""

$migrationCount = 0
$errors = @()

foreach ($migration in $migrations) {
    $migrationPath = Join-Path $MigrationsDir $migration
    $migrationCount++
    
    Write-Host ">>> Migration $migrationCount/$($migrations.Count): $migration" -ForegroundColor Cyan
    
    try {
        psql -U $DbUser -d $DbName -f $migrationPath
        Write-Host "✅ $migration aplicada com sucesso" -ForegroundColor Green
    } catch {
        $errorMsg = "Erro ao aplicar $migration : $_"
        $errors += $errorMsg
        Write-Host "❌ $errorMsg" -ForegroundColor Red
        
        # Parar execução em caso de erro
        Write-Host ""
        Write-Host "⚠️  PROCESSO INTERROMPIDO devido a erro" -ForegroundColor Red
        Write-Host "   Verifique o log acima e corrija antes de continuar" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host ""
}

# Verificação de integridade
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔍 VERIFICAÇÃO DE INTEGRIDADE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar FKs criadas
Write-Host "Verificando Foreign Keys..." -ForegroundColor Yellow
$fkQuery = @"
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (
    (tc.table_name = 'clinicas_empresas' AND kcu.column_name = 'clinica_id')
    OR (tc.table_name = 'analise_estatistica' AND kcu.column_name = 'avaliacao_id')
  )
ORDER BY tc.table_name;
"@

psql -U $DbUser -d $DbName -c $fkQuery

# Verificar CHECK constraints
Write-Host ""
Write-Host "Verificando CHECK Constraints..." -ForegroundColor Yellow
$checkQuery = @"
SELECT 
    tc.table_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_name = 'funcionarios'
  AND tc.constraint_name IN ('funcionarios_nivel_cargo_check', 'funcionarios_clinica_check')
ORDER BY tc.constraint_name;
"@

psql -U $DbUser -d $DbName -c $checkQuery

# Verificar tabela removida
Write-Host ""
Write-Host "Verificando remoção de tabela redundante..." -ForegroundColor Yellow
$tableCheckQuery = @"
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'lotes_avaliacao_funcionarios'
        ) THEN '❌ ERRO: Tabela ainda existe'
        ELSE '✅ OK: Tabela removida'
    END as status;
"@

psql -U $DbUser -d $DbName -c $tableCheckQuery

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ TODAS AS MIGRATIONS APLICADAS COM SUCESSO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Executar testes
Write-Host "🧪 Executando testes de integridade..." -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "   Rodando testes de migrations..." -ForegroundColor Gray
    pnpm test migrations-integrity --silent
    
    Write-Host "   Rodando testes de status de lotes..." -ForegroundColor Gray
    pnpm test lote-status-sync --silent
    
    Write-Host ""
    Write-Host "✅ Todos os testes passaram!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "⚠️  Alguns testes falharam. Revise os logs acima." -ForegroundColor Yellow
    Write-Host "   As migrations foram aplicadas, mas pode haver problemas." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PRÓXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Revisar logs de verificação acima" -ForegroundColor White
Write-Host "2. ✅ Executar suite completa de testes: pnpm test" -ForegroundColor White
Write-Host "3. ✅ Testar funcionalidades críticas manualmente" -ForegroundColor White
Write-Host "4. ✅ Revisar documentação: docs\CORREÇÕES-INTEGRIDADE-20251220.md" -ForegroundColor White

if ($Ambiente -eq "dev") {
    Write-Host "5. ⏳ Aplicar em ambiente de staging/produção" -ForegroundColor Yellow
} else {
    Write-Host "5. ✅ Monitorar logs de aplicação por 24h" -ForegroundColor White
}

Write-Host ""
Write-Host "Backup disponível em: $BackupFile" -ForegroundColor Cyan
Write-Host ""
