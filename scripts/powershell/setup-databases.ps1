# Script de Setup dos Bancos de Dados - Qwork
# Execute: .\setup-databases.ps1

Write-Host "🗄️ Configurando bancos de dados Qwork..." -ForegroundColor Cyan

# Configurações
$pgUser = "postgres"
$pgPassword = "123456"
$devDatabase = "nr-bps_db"
$testDatabase = "nr-bps_db_test"
$schemaFile = "database\schema-complete.sql"

# Configurar senha para evitar prompts
$env:PGPASSWORD = $pgPassword

Write-Host "`n📋 Configuração:" -ForegroundColor Yellow
Write-Host "   Usuário PostgreSQL: $pgUser" -ForegroundColor White
Write-Host "   Banco Desenvolvimento: $devDatabase" -ForegroundColor White
Write-Host "   Banco Testes: $testDatabase" -ForegroundColor White
Write-Host "   Schema: $schemaFile" -ForegroundColor White

# Verificar se PostgreSQL está disponível
Write-Host "`n🔍 Verificando PostgreSQL..." -ForegroundColor Yellow
$pgVersion = psql --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL encontrado: $pgVersion" -ForegroundColor Green
}
else {
    Write-Host "❌ PostgreSQL não encontrado. Instale pgAdmin 4 primeiro!" -ForegroundColor Red
    Write-Host "   Download: https://www.pgadmin.org/download/" -ForegroundColor Yellow
    exit 1
}

# Verificar se o arquivo schema existe
if (!(Test-Path $schemaFile)) {
    Write-Host "❌ Arquivo schema não encontrado: $schemaFile" -ForegroundColor Red
    exit 1
}

Write-Host "`n🗄️ Criando bancos de dados..." -ForegroundColor Yellow

# Criar banco de desenvolvimento
Write-Host "📦 Criando banco de desenvolvimento: $devDatabase" -ForegroundColor Cyan
$createDevResult = psql -U $pgUser -c "DROP DATABASE IF EXISTS $devDatabase;" 2>$null
$createDevResult = psql -U $pgUser -c "CREATE DATABASE `"$devDatabase`";" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Banco de desenvolvimento criado com sucesso" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Erro ao criar banco de desenvolvimento (pode já existir)" -ForegroundColor Yellow
}

# Criar banco de testes
Write-Host "🧪 Criando banco de testes: $testDatabase" -ForegroundColor Cyan  
$createTestResult = psql -U $pgUser -c "DROP DATABASE IF EXISTS $testDatabase;" 2>$null
$createTestResult = psql -U $pgUser -c "CREATE DATABASE `"$testDatabase`";" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Banco de testes criado com sucesso" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Erro ao criar banco de testes (pode já existir)" -ForegroundColor Yellow
}

Write-Host "`n📋 Executando schemas..." -ForegroundColor Yellow

# Executar schema no banco de desenvolvimento
Write-Host "📦 Aplicando schema no banco de desenvolvimento..." -ForegroundColor Cyan
psql -U $pgUser -d $devDatabase -f $schemaFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema aplicado no banco de desenvolvimento" -ForegroundColor Green
}
else {
    Write-Host "❌ Erro ao aplicar schema no banco de desenvolvimento" -ForegroundColor Red
}

# Executar schema no banco de testes
Write-Host "🧪 Aplicando schema no banco de testes..." -ForegroundColor Cyan
psql -U $pgUser -d $testDatabase -f $schemaFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema aplicado no banco de testes" -ForegroundColor Green
}
else {
    Write-Host "❌ Erro ao aplicar schema no banco de testes" -ForegroundColor Red
}

Write-Host "`n🔍 Verificando configuração..." -ForegroundColor Yellow

# Verificar tabelas no banco de desenvolvimento
Write-Host "📦 Tabelas no banco de desenvolvimento:" -ForegroundColor Cyan
psql -U $pgUser -d $devDatabase -c "\dt"

# Verificar usuários no banco de desenvolvimento
Write-Host "`n👤 Usuários de teste (desenvolvimento):" -ForegroundColor Cyan
psql -U $pgUser -d $devDatabase -c "SELECT cpf, nome, email, perfil FROM funcionarios ORDER BY perfil DESC;"

# Verificar tabelas no banco de testes
Write-Host "`n🧪 Tabelas no banco de testes:" -ForegroundColor Cyan
psql -U $pgUser -d $testDatabase -c "\dt"

Write-Host "`n📝 Configurando arquivos .env..." -ForegroundColor Yellow

# Criar arquivo .env para desenvolvimento (se não existir)
if (!(Test-Path ".env")) {
    Write-Host "📄 Criando arquivo .env (desenvolvimento)..." -ForegroundColor Cyan
    Copy-Item ".env.development" ".env"
    Write-Host "✅ Arquivo .env criado baseado em .env.development" -ForegroundColor Green
}
else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor Green
}

Write-Host "`n✨ Setup dos bancos concluído!" -ForegroundColor Cyan
Write-Host "`n📝 Resumo da configuração:" -ForegroundColor Yellow
Write-Host "   🗄️ Banco Desenvolvimento: postgresql://postgres:123456@localhost:5432/nr-bps_db" -ForegroundColor White
Write-Host "   🧪 Banco Testes: postgresql://postgres:123456@localhost:5432/nr-bps_db_test" -ForegroundColor White
Write-Host "`n👤 Usuários de teste disponíveis:" -ForegroundColor Yellow
Write-Host "   🔧 Admin: CPF 00000000000 / Senha: 123" -ForegroundColor White
Write-Host "   👔 RH: CPF 11111111111 / Senha: 123" -ForegroundColor White
Write-Host "   👨‍🏢 Emissor: CPF 33333333333 / Senha: 123" -ForegroundColor White

Write-Host "`n🚀 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Execute: pnpm dev" -ForegroundColor White
Write-Host "   2. Acesse: http://localhost:3000" -ForegroundColor White
Write-Host "   3. Faça login com um dos usuários acima" -ForegroundColor White

Write-Host "`n🧪 Para executar testes:" -ForegroundColor Yellow
Write-Host "   1. Execute: pnpm test" -ForegroundColor White
Write-Host "   2. Os testes usarão automaticamente o banco: nr-bps_db_test" -ForegroundColor White

# Limpar variável de ambiente
Remove-Item Env:PGPASSWORD