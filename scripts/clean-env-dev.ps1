# Script para limpar variáveis de ambiente e iniciar desenvolvimento com configuração correta
# Uso: .\scripts\clean-env-dev.ps1

Write-Host "🧹 Limpando variáveis de ambiente de teste..." -ForegroundColor Yellow

# Remover variáveis de teste que podem ter sido definidas
$env:TEST_DATABASE_URL = $null
$env:NODE_ENV = "development"

Write-Host "✓ Variáveis de ambiente limpas" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Configuração atual:" -ForegroundColor Cyan
Write-Host "  NODE_ENV: $($env:NODE_ENV)" -ForegroundColor White
Write-Host "  TEST_DATABASE_URL: $(if ($env:TEST_DATABASE_URL) { $env:TEST_DATABASE_URL } else { '(não definida) ✓' })" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Iniciando servidor de desenvolvimento..." -ForegroundColor Green
Write-Host "   O .env.local será carregado automaticamente" -ForegroundColor Gray
Write-Host "   LOCAL_DATABASE_URL: nr-bps_db (desenvolvimento)" -ForegroundColor Gray
Write-Host ""

# Executar pnpm dev
pnpm dev
