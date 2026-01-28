# Script de setup do Qwork
# Execute: .\setup.ps1

Write-Host "🚀 Iniciando setup do Qwork..." -ForegroundColor Cyan

# Verificar Node.js
Write-Host "`n📦 Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
}
else {
    Write-Host "❌ Node.js não encontrado. Instale em: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar PostgreSQL
Write-Host "`n🗄️ Verificando PostgreSQL..." -ForegroundColor Yellow
$pgVersion = psql --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL encontrado: $pgVersion" -ForegroundColor Green
}
else {
    Write-Host "⚠️ PostgreSQL não encontrado. Instale pgAdmin 4 para desenvolvimento local" -ForegroundColor Yellow
}

# Instalar dependências
Write-Host "`n📥 Instalando dependências..." -ForegroundColor Yellow
pnpm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}

# Criar arquivo .env se não existir
if (!(Test-Path ".env")) {
    Write-Host "`n⚙️ Criando arquivo .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Arquivo .env criado. Configure as variáveis antes de continuar!" -ForegroundColor Green
}
else {
    Write-Host "`n✅ Arquivo .env já existe" -ForegroundColor Green
}

# Criar banco de dados local (se PostgreSQL estiver disponível)
if ($pgVersion) {
    Write-Host "`n🗄️ Deseja criar o banco de dados local? (S/N)" -ForegroundColor Yellow
    $resposta = Read-Host
    
    if ($resposta -eq "S" -or $resposta -eq "s") {
        Write-Host "Digite a senha do PostgreSQL:" -ForegroundColor Yellow
        $senha = Read-Host -AsSecureString
        $senhaText = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($senha)
        )
        
        # Criar banco
        Write-Host "Criando banco bps_brasil..." -ForegroundColor Yellow
        $env:PGPASSWORD = $senhaText
        psql -U postgres -c "CREATE DATABASE bps_brasil;" 2>$null
        
        # Executar schema
        Write-Host "Executando schema..." -ForegroundColor Yellow
        psql -U postgres -d bps_brasil -f "database\schema.sql"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Banco de dados criado com sucesso!" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️ Erro ao criar banco. Crie manualmente via pgAdmin 4" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n✨ Setup concluído!" -ForegroundColor Cyan
Write-Host "`n📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Configure o arquivo .env com suas credenciais" -ForegroundColor White
Write-Host "2. Execute: pnpm dev" -ForegroundColor White
Write-Host "3. Acesse: http://localhost:3000" -ForegroundColor White
Write-Host "`n👤 Usuários de teste (DEV ONLY):" -ForegroundColor Yellow
Write-Host "   ⚠️  ATENÇÃO: Altere as credenciais padrão antes do deploy em produção!" -ForegroundColor Red
Write-Host "   Consulte o banco de dados para as credenciais criadas." -ForegroundColor White
Write-Host "`n🚀 Para fazer deploy na sua plataforma: consulte a documentação do seu provedor (ex.: vercel --prod)" -ForegroundColor Cyan
