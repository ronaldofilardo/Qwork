# Script para executar testes de emissão manual de laudos
# Configura variáveis de ambiente para usar banco de teste

Write-Host "🧪 Executando testes de emissão manual de laudos..." -ForegroundColor Cyan
Write-Host "📊 Banco: nr-bps_db_test @ localhost:5432" -ForegroundColor Yellow
Write-Host ""

# Voltar ao diretório raiz do projeto
Set-Location -Path (Join-Path $PSScriptRoot "..\..") 

$env:DATABASE_URL = "postgresql://postgres:123456@localhost:5432/nr-bps_db_test"
$env:LOCAL_DATABASE_URL = ""
$env:NODE_ENV = "test"
$env:TEST_DATABASE_URL = "postgresql://postgres:123456@localhost:5432/nr-bps_db_test"

npx jest __tests__/correcoes-31-01-2026/emissao-manual-fluxo.test.ts --config jest.unit.config.cjs --runInBand --forceExit --no-cache

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Todos os testes passaram!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Alguns testes falharam." -ForegroundColor Red
}
