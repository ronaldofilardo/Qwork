# Teste Manual Sem Senha PostgreSQL

Write-Host "🔍 VERIFICAÇÃO DO LOTE 24" -ForegroundColor Cyan
Write-Host ""

# Verificar se há logs de erro do servidor
Write-Host "📋 Últimas linhas do terminal do servidor:" -ForegroundColor Yellow
Write-Host "(Pressione Ctrl+C se não aparecer nada após 5 segundos)" -ForegroundColor Gray
Write-Host ""

# Simular verificação via API (se houver endpoint)
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/lotes/24" -Method GET -ErrorAction Stop
    Write-Host "✅ Lote #24 via API:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "⚠️  Endpoint de lotes não disponível" -ForegroundColor Yellow
    Write-Host "Causa: $_" -ForegroundColor Gray
}

Write-Host ""
Write-Host "💡 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Abra o pgAdmin ou psql" -ForegroundColor White
Write-Host "2. Execute o arquivo: verificar-lote-24.sql" -ForegroundColor White
Write-Host "3. Verifique se status_pagamento = 'pago'" -ForegroundColor White
Write-Host ""
Write-Host "OU" -ForegroundColor Yellow
Write-Host ""
Write-Host "Atualize a página do admin (F5) para ver se mudou" -ForegroundColor White
