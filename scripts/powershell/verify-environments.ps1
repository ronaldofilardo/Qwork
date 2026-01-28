# Script de Verificação - Ambientes Dev e Prod
# Compara configurações e verifica se tudo está sincronizado

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "VERIFICAÇÃO DE AMBIENTES" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Função para verificar arquivo
function Check-File {
    param($path, $description)
    if (Test-Path $path) {
        Write-Host "✅ $description encontrado" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $description NÃO encontrado" -ForegroundColor Red
        return $false
    }
}

# Função para executar query SQL
function Execute-Query {
    param($connString, $query)
    $env:PGPASSWORD = if ($connString -like "*localhost*") { "123456" } else { "npg_NfJGO8vck9ob" }
    $result = $query | psql $connString -t -A
    return $result
}

# 1. Verificar arquivos de configuração
Write-Host "1. Verificando arquivos de configuração..." -ForegroundColor Yellow
Check-File ".env.development" "Arquivo .env.development"
Check-File ".env.production" "Arquivo .env.production"
Check-File "database/schema-clean-final.sql" "Schema SQL"
Check-File "lib/db.ts" "Biblioteca de conexão"

Write-Host ""

# 2. Verificar variáveis de ambiente
Write-Host "2. Verificando variáveis de ambiente..." -ForegroundColor Yellow

if (Test-Path ".env.development") {
    $devContent = Get-Content ".env.development"
    Write-Host "   DEV:" -ForegroundColor Cyan
    $devContent | Where-Object { $_ -match "^NODE_ENV|^LOCAL_DATABASE_URL|^DATABASE_URL" } | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Gray
    }
}

Write-Host ""

if (Test-Path ".env.production") {
    $prodContent = Get-Content ".env.production"
    Write-Host "   PROD:" -ForegroundColor Cyan
    $prodContent | Where-Object { $_ -match "^NODE_ENV|^DATABASE_URL" } | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Gray
    }
}

Write-Host ""

# 3. Verificar psql
Write-Host "3. Verificando ferramentas PostgreSQL..." -ForegroundColor Yellow
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "✅ psql instalado" -ForegroundColor Green
    $psqlVersion = psql --version
    Write-Host "   Versão: $psqlVersion" -ForegroundColor Gray
} else {
    Write-Host "❌ psql NÃO instalado" -ForegroundColor Red
    Write-Host "   Instale o PostgreSQL Client Tools" -ForegroundColor Yellow
}

if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
    Write-Host "✅ pg_dump instalado" -ForegroundColor Green
} else {
    Write-Host "❌ pg_dump NÃO instalado" -ForegroundColor Red
}

Write-Host ""

# 4. Testar conexões com bancos
Write-Host "4. Testando conexões com bancos de dados..." -ForegroundColor Yellow

# Desenvolvimento
Write-Host "   Testando banco de DESENVOLVIMENTO..." -ForegroundColor Cyan
$localConnString = "postgresql://postgres:123456@localhost:5432/nr-bps_db"
$env:PGPASSWORD = "123456"
$localTest = "SELECT COUNT(*) FROM funcionarios;" | psql $localConnString -t -A 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Conexão LOCAL OK - $localTest funcionários" -ForegroundColor Green
} else {
    Write-Host "   ❌ Falha ao conectar no banco LOCAL" -ForegroundColor Red
    Write-Host "   Certifique-se de que o PostgreSQL está rodando localmente" -ForegroundColor Yellow
}

Write-Host ""

# Produção
Write-Host "   Testando banco de PRODUÇÃO..." -ForegroundColor Cyan
$prodConnString = "postgresql://neondb_owner:npg_NfJGO8vck9ob@ep-steep-credit-acckkvg4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:PGPASSWORD = "npg_NfJGO8vck9ob"
$prodTest = "SELECT COUNT(*) FROM funcionarios;" | psql $prodConnString -t -A 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Conexão NEON (PROD) OK - $prodTest funcionários" -ForegroundColor Green
} else {
    Write-Host "   ❌ Falha ao conectar no banco NEON" -ForegroundColor Red
    Write-Host "   Verifique a conexão com a internet e as credenciais" -ForegroundColor Yellow
}

Write-Host ""

# 5. Comparar dados entre ambientes
Write-Host "5. Comparando dados entre ambientes..." -ForegroundColor Yellow

$tables = @("clinicas", "empresas_clientes", "funcionarios", "avaliacoes", "respostas", "resultados")

foreach ($table in $tables) {
    $env:PGPASSWORD = "123456"
    $localCount = "SELECT COUNT(*) FROM $table;" | psql $localConnString -t -A 2>$null
    
    $env:PGPASSWORD = "npg_NfJGO8vck9ob"
    $prodCount = "SELECT COUNT(*) FROM $table;" | psql $prodConnString -t -A 2>$null
    
    if ($localCount -eq $prodCount) {
        Write-Host "   ✅ $table`: DEV=$localCount | PROD=$prodCount (IGUAIS)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $table`: DEV=$localCount | PROD=$prodCount (DIFERENTES)" -ForegroundColor Yellow
    }
}

Write-Host ""

# 6. Verificar usuários específicos
Write-Host "6. Verificando usuários padrão..." -ForegroundColor Yellow

$userQuery = @"
SELECT 
    cpf, 
    nome, 
    perfil, 
    CASE 
        WHEN clinica_id IS NOT NULL THEN 'Sim' 
        ELSE 'Não' 
    END as tem_clinica,
    CASE 
        WHEN empresa_id IS NOT NULL THEN 'Sim' 
        ELSE 'Não' 
    END as tem_empresa
FROM funcionarios 
WHERE cpf IN ('00000000000', '11111111111', '22222222222')
ORDER BY 
    CASE 
        WHEN perfil = 'admin' THEN 1 
        WHEN perfil = 'admin' THEN 2 
        WHEN perfil = 'rh' THEN 3 
        ELSE 4 
    END;
"@

Write-Host "   DESENVOLVIMENTO:" -ForegroundColor Cyan
$env:PGPASSWORD = "123456"
$userQuery | psql $localConnString

Write-Host ""
Write-Host "   PRODUÇÃO:" -ForegroundColor Cyan
$env:PGPASSWORD = "npg_NfJGO8vck9ob"
$userQuery | psql $prodConnString

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "RESUMO" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Desenvolvimento: postgresql://postgres:123456@localhost:5432/nr-bps_db" -ForegroundColor Green
Write-Host "✅ Produção: Neon Database (AWS South America)" -ForegroundColor Green
Write-Host ""
Write-Host "Para sincronizar dados DEV -> PROD, execute:" -ForegroundColor Yellow
Write-Host "   .\sync-dev-to-prod.ps1" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  CREDENCIAIS DE DESENVOLVIMENTO (NÃO USAR EM PRODUÇÃO)" -ForegroundColor Red
Write-Host "   Consulte o banco de dados ou documentação interna para credenciais." -ForegroundColor Yellow
Write-Host ""
