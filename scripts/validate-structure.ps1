#!/usr/bin/env pwsh
# Script de Validação Rápida - Estrutura Organizacional
# Execute: .\validate-structure.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VALIDAÇÃO: Estrutura Organizacional" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$dbName = "nr-bps_db"
$dbUser = "postgres"
$dbHost = "localhost"

# Função para executar query
function Invoke-DbQuery {
    param([string]$Query)
    psql -h $dbHost -U $dbUser -d $dbName -t -c $Query 2>&1
}

# Contador de erros
$errors = 0
$warnings = 0

Write-Host "[1/8] Verificando enum usuario_tipo_enum..." -ForegroundColor Yellow
$enumValues = Invoke-DbQuery "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'usuario_tipo_enum'::regtype ORDER BY enumlabel;"
if ($enumValues -like "*gestor*") {
    Write-Host "   ❌ ERRO: Enum ainda contém 'gestor'" -ForegroundColor Red
    $errors++
} elseif ($enumValues -notlike "*gestor*") {
    Write-Host "   ❌ ERRO: Enum NÃO contém 'gestor'" -ForegroundColor Red
    $errors++
} else {
    Write-Host "   ✓ Enum correto (gestor presente, gestor removido)" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/8] Verificando constraints..." -ForegroundColor Yellow
$constraints = Invoke-DbQuery "SELECT conname FROM pg_constraint WHERE conname IN ('usuarios_gestor_check', 'funcionarios_owner_check');"
$constraintCount = ($constraints | Measure-Object -Line).Lines
if ($constraintCount -lt 2) {
    Write-Host "   ❌ ERRO: Faltam constraints ($constraintCount/2 encontradas)" -ForegroundColor Red
    $errors++
} else {
    Write-Host "   ✓ Constraints criadas (2/2)" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/8] Verificando empresas sem clinica_id..." -ForegroundColor Yellow
$orphanEmpresas = Invoke-DbQuery "SELECT COUNT(*) FROM empresas_clientes WHERE clinica_id IS NULL;"
$orphanCount = [int]($orphanEmpresas.Trim())
if ($orphanCount -gt 0) {
    Write-Host "   ❌ ERRO: $orphanCount empresas sem clinica_id" -ForegroundColor Red
    $errors++
} else {
    Write-Host "   ✓ Todas as empresas têm clinica_id" -ForegroundColor Green
}

Write-Host ""
Write-Host "[4/8] Verificando funcionários inválidos..." -ForegroundColor Yellow
$invalidFuncs = Invoke-DbQuery "SELECT COUNT(*) FROM funcionarios WHERE contratante_id IS NOT NULL AND clinica_id IS NOT NULL;"
$invalidCount = [int]($invalidFuncs.Trim())
if ($invalidCount -gt 0) {
    Write-Host "   ❌ ERRO: $invalidCount funcionários com contratante_id E clinica_id" -ForegroundColor Red
    $errors++
} else {
    Write-Host "   ✓ Nenhum funcionário inválido (exclusividade OK)" -ForegroundColor Green
}

Write-Host ""
Write-Host "[5/8] Verificando view gestores..." -ForegroundColor Yellow
$viewExists = Invoke-DbQuery "SELECT COUNT(*) FROM pg_views WHERE viewname = 'gestores';"
$viewCount = [int]($viewExists.Trim())
if ($viewCount -eq 0) {
    Write-Host "   ❌ ERRO: View 'gestores' não existe" -ForegroundColor Red
    $errors++
} else {
    $gestoresCount = Invoke-DbQuery "SELECT COUNT(*) FROM gestores;"
    Write-Host "   ✓ View 'gestores' existe ($($gestoresCount.Trim()) gestores)" -ForegroundColor Green
}

Write-Host ""
Write-Host "[6/8] Verificando integridade referencial..." -ForegroundColor Yellow
$orphanFuncs = Invoke-DbQuery "SELECT COUNT(*) FROM funcionarios f LEFT JOIN contratantes c ON f.contratante_id = c.id WHERE f.contratante_id IS NOT NULL AND c.id IS NULL;"
$orphanFuncCount = [int]($orphanFuncs.Trim())
if ($orphanFuncCount -gt 0) {
    Write-Host "   ⚠️  AVISO: $orphanFuncCount funcionários órfãos" -ForegroundColor Yellow
    $warnings++
} else {
    Write-Host "   ✓ Integridade referencial OK" -ForegroundColor Green
}

Write-Host ""
Write-Host "[7/8] Verificando clinica_id NOT NULL..." -ForegroundColor Yellow
$notNull = Invoke-DbQuery "SELECT is_nullable FROM information_schema.columns WHERE table_name = 'empresas_clientes' AND column_name = 'clinica_id';"
if ($notNull.Trim() -eq "NO") {
    Write-Host "   ✓ empresas_clientes.clinica_id é NOT NULL" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERRO: empresas_clientes.clinica_id não é NOT NULL" -ForegroundColor Red
    $errors++
}

Write-Host ""
Write-Host "[8/8] Verificando dados de teste..." -ForegroundColor Yellow
$entidades = Invoke-DbQuery "SELECT COUNT(*) FROM contratantes WHERE tipo = 'entidade';"
$clinicas = Invoke-DbQuery "SELECT COUNT(*) FROM contratantes WHERE tipo = 'clinica';"
Write-Host "   ℹ️  Entidades: $($entidades.Trim())" -ForegroundColor Cyan
Write-Host "   ℹ️  Clínicas: $($clinicas.Trim())" -ForegroundColor Cyan

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESULTADO DA VALIDAÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCESSO! Estrutura validada sem erros" -ForegroundColor Green
    Write-Host ""
} elseif ($errors -eq 0) {
    Write-Host ""
    Write-Host "⚠️  PARCIAL: $warnings avisos encontrados" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ FALHA: $errors erros e $warnings avisos" -ForegroundColor Red
    Write-Host ""
    Write-Host "Executar migration:" -ForegroundColor Yellow
    Write-Host "psql -h localhost -U postgres -d nr-bps_db -f database/migrations/400c_estrutura_organizacional_final.sql" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Executar testes: npm test __tests__/integration/" -ForegroundColor White
Write-Host "   2. Iniciar aplicação: npm run dev" -ForegroundColor White
Write-Host "   3. Validar funcionalidades no navegador" -ForegroundColor White
Write-Host ""
