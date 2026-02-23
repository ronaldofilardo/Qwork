# Script de Debug do Webhook Asaas
# Testa o webhook e mostra logs detalhados

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Teste de Debug - Webhook Asaas" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1 Verificar se servidor está rodando
Write-Host "[1/5] Verificando servidor..." -ForegroundColor Yellow
try {
    $test = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ Servidor está rodando na porta 3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor NÃO está rodando!" -ForegroundColor Red
    Write-Host "Execute: npm run dev" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 2. Consultar dados antes do teste
Write-Host "[2/5] Consultando dados atuais do banco..." -ForegroundColor Yellow
$queryAntes = "SELECT id, status_pagamento, pago_em, pagamento_metodo FROM lotes_avaliacao WHERE id = 24;"
Write-Host "Executando: $queryAntes" -ForegroundColor DarkGray

$output = psql -U postgres -d nr-bps_db -c $queryAntes -A 2>&1 | Out-String
if ($output -match "aguardando_pagamento") {
    Write-Host "✅ Lote 24 encontrado: status_pagamento = aguardando_pagamento" -ForegroundColor Green
} elseif ($output -match "pago") {
    Write-Host "⚠️  Lote 24 JÁ está com status = pago" -ForegroundColor Yellow
    Write-Host "   Para testar novamente, execute:" -ForegroundColor Gray
    Write-Host "   UPDATE lotes_avaliacao SET status_pagamento='aguardando_pagamento', pago_em=NULL, pagamento_metodo=NULL WHERE id=24;" -ForegroundColor Gray
} else {
    Write-Host "❌ Erro ao consultar lote 24" -ForegroundColor Red
    Write-Host $output
    exit 1
}
Write-Host ""

# 3. Enviar webhook de teste
Write-Host "[3/5] Enviando webhook de teste..." -ForegroundColor Yellow
$webhookPayload = @"
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_dkiqwxyrnt9jf4q3",
    "customer": "cus_000007569932",
    "billingType": "CREDIT_CARD",
    "value": 45.00,
    "netValue": 45.00,
    "status": "CONFIRMED",
    "dueDate": "2026-02-20",
    "confirmedDate": "2026-02-17T02:25:00.000Z",
    "paymentDate": "2026-02-17T02:25:00.000Z",
    "dateCreated": "2026-02-17T01:28:00.000Z",
    "externalReference": "lote_24_pagamento_34",
    "description": "Emissão de Laudo - Lote #24",
    "invoiceUrl": "https://sandbox.asaas.com/i/pay_dkiqwxyrnt9jf4q3",
    "object": "payment"
  }
}
"@

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/webhooks/asaas" `
        -Method POST `
        -ContentType "application/json" `
        -Body $webhookPayload
    
    Write-Host "✅ Webhook enviado com sucesso!" -ForegroundColor Green
    Write-Host "   Resposta:" -ForegroundColor Gray
    Write-Host "   $(ConvertTo-Json $response -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao enviar webhook!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
Write-Host ""

# 4. Aguardar processamento
Write-Host "[4/5] Aguardando processamento (2 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host ""

# 5. Verificar se foi atualizado
Write-Host "[5/5] Verificando resultado..." -ForegroundColor Yellow
$output = psql -U postgres -d nr-bps_db -c $queryAntes -A 2>&1 | Out-String
if ($output -match "pago\|(\d{4}-\d{2}-\d{2}[^|]*)\|credit_card") {
    Write-Host "✅ SUCESSO! Lote 24 foi atualizado:" -ForegroundColor Green
    Write-Host "   - status_pagamento: pago" -ForegroundColor Green  
    Write-Host "   - pago_em: $($Matches[1])" -ForegroundColor Green
    Write-Host "   - pagamento_metodo: credit_card" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Webhook funcionando corretamente!" -ForegroundColor Cyan
} elseif ($output -match "aguardando_pagamento") {
    Write-Host "❌ FALHA! Lote 24 ainda está com status_pagamento = aguardando_pagamento" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verifique os logs do servidor Next.js (terminal onde rodou 'npm run dev')" -ForegroundColor Gray
    Write-Host "2. Procure por mensagens de erro como:" -ForegroundColor Gray
    Write-Host "   - [Asaas Webhook] Erro ao processar pagamento:" -ForegroundColor DarkGray
    Write-Host "   - error: coluna ... não existe" -ForegroundColor DarkGray
    Write-Host "   - ROLLBACK" -ForegroundColor DarkGray
    Write-Host "3. Se houver erro de coluna inexistente, houve problema no código" -ForegroundColor Gray
    Write-Host "4. Se não houver logs, o servidor pode estar usando código antigo (reinicie)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔧 Comandos úteis:" -ForegroundColor Yellow
    Write-Host "   # Ver logs de webhook processados:" -ForegroundColor Gray
    Write-Host "   psql -U postgres -d nr-bps_db -c `"SELECT * FROM webhook_logs WHERE payment_id='pay_dkiqwxyrnt9jf4q3' ORDER BY processed_at DESC;`"" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "   # Reset do lote para testar novamente:" -ForegroundColor Gray
    Write-Host "   psql -U postgres -d nr-bps_db -c `"UPDATE lotes_avaliacao SET status_pagamento='aguardando_pagamento', pago_em=NULL, pagamento_metodo=NULL WHERE id=24;`"" -ForegroundColor DarkGray
} else {
    Write-Host "⚠️  Resultado inesperado:" -ForegroundColor Yellow
    Write-Host $output
}
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
