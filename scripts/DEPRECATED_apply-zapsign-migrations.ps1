# Script para aplicar migrações ZapSign no DEV (nr-bps_db)
# Uso: .\scripts\apply-zapsign-migrations.ps1

param(
    [string]$Environment = "dev",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "123456"
)

$ErrorActionPreference = "Stop"

# Determine database based on environment
$databases = @{
    "dev"     = "nr-bps_db"
    "test"    = "nr-bps_db_test"
    "staging" = "neondb_staging"
    "prod"    = "neondb"
}

if (-not $databases.ContainsKey($Environment)) {
    Write-Host "❌ Ambiente inválido. Opções: dev, test, staging, prod" -ForegroundColor Red
    exit 1
}

$database = $databases[$Environment]

Write-Host "🚀 Aplicando migrações ZapSign para: $Environment ($database)" -ForegroundColor Cyan

# Para staging/prod, usar a connection string Neon
if ($Environment -eq "staging" -or $Environment -eq "prod") {
    if ($Environment -eq "staging") {
        $connString = "postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_staging?sslmode=require"
    } else {
        $connString = "postgresql://neondb_owner:npg_..." # prod URL aqui
    }
    
    Write-Host "📍 Conectando a Neon ($Environment)..." -ForegroundColor Yellow
    # psql via connString
    $env:PGPASSWORD = ""
    psql $connString -f database/migrations/1138_zapsign_assinatura_digital.sql
    psql $connString -f database/migrations/1143a_add_zapsign_sign_url.sql
} else {
    # DEV/TEST local
    Write-Host "📍 Conectando a localhost..." -ForegroundColor Yellow
    $env:PGPASSWORD = $DbPassword
    
    Write-Host "⏳ Aplicando migração 1138 (ZapSign assinatura digital)..." -ForegroundColor Cyan
    psql -U $DbUser -h $DbHost -p $DbPort -d $database -f database/migrations/1138_zapsign_assinatura_digital.sql
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao aplicar migração 1138" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "⏳ Aplicando migração 1143 (ZapSign sign_url)..." -ForegroundColor Cyan
    psql -U $DbUser -h $DbHost -p $DbPort -d $database -f database/migrations/1143a_add_zapsign_sign_url.sql
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao aplicar migração 1143" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Migrações ZapSign aplicadas com sucesso!" -ForegroundColor Green
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Verificar que o webhook ZapSign está configurado em .env" -ForegroundColor Cyan
Write-Host "   2. Testar fluxo de assinatura no dashboard emissor" -ForegroundColor Cyan
Write-Host "   3. Confirmar que campos zapsign_* estão preenchidos após assinatura" -ForegroundColor Cyan
