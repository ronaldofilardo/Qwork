#!/usr/bin/env pwsh
# Script para testar webhook do Asaas em produção
# Data: 17/02/2026

$ErrorActionPreference = "Continue"

Write-Host "`n══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TESTE DO ENDPOINT EM PRODUÇÃO" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════`n" -ForegroundColor Cyan

$prodUrl = "https://qwork-psi.vercel.app"

# ==========================================
# 1. Health Check
# ==========================================
Write-Host "1️⃣  Testando Health Check do Webhook..." -ForegroundColor Yellow
Write-Host "   URL: $prodUrl/api/webhooks/asaas" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$prodUrl/api/webhooks/asaas" -Method GET -ErrorAction Stop
    
    Write-Host "   ✅ SUCESSO!" -ForegroundColor Green
    Write-Host "   📋 Resposta:" -ForegroundColor Cyan
    Write-Host "      Service: $($response.service)" -ForegroundColor White
    Write-Host "      Status: $($response.status)" -ForegroundColor White  
    Write-Host "      Environment: $($response.env)" -ForegroundColor White
    Write-Host "      Timestamp: $($response.timestamp)" -ForegroundColor White
    
    $secretConfigured = $response.webhookSecretConfigured
    $secretColor = if($secretConfigured){'Green'}else{'Red'}
    Write-Host "      Webhook Secret: $secretConfigured" -ForegroundColor $secretColor
    Write-Host ""
    
    if (-not $secretConfigured) {
        Write-Host "   ⚠️  ATENÇÃO: ASAAS_WEBHOOK_SECRET não está configurado no Vercel!" -ForegroundColor Red
        Write-Host "   📝 O webhook não validará tokens de segurança." -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host "   ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# ==========================================
# 2. Teste de POST (simulação de webhook)
# ==========================================
Write-Host "`n2️⃣  Testando Webhook POST (simulação)..." -ForegroundColor Yellow
Write-Host "   Enviando payload de teste..." -ForegroundColor Gray
Write-Host ""

$testPayload = @{
    event = "PAYMENT_RECEIVED"
    payment = @{
        id = "pay_test_$(Get-Date -Format 'yyyyMMddHHmmss')"
        status = "RECEIVED"
        value = 1.00
        externalReference = "lote_999_pagamento_test"
        object = "payment"
        dateCreated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")
        customer = "cus_test_123"
        dueDate = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")
        originalDueDate = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")
        netValue = 0.95
        billingType = "PIX"
        deleted = $false
        anticipated = $false
        anticipable = $false
    }
} | ConvertTo-Json -Depth 10

try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    $postResponse = Invoke-RestMethod `
        -Uri "$prodUrl/api/webhooks/asaas" `
        -Method POST `
        -Body $testPayload `
        -Headers $headers `
        -ErrorAction Stop
        
    Write-Host "   ✅ Webhook aceito!" -ForegroundColor Green
    Write-Host "   📋 Resposta:" -ForegroundColor Cyan
    Write-Host "      Received: $($postResponse.received)" -ForegroundColor White
    Write-Host "      Event: $($postResponse.event)" -ForegroundColor White
    Write-Host "      Payment ID: $($postResponse.paymentId)" -ForegroundColor White
    Write-Host "      Processed In: $($postResponse.processedIn)" -ForegroundColor White
    Write-Host ""
    Write-Host "   ℹ️  Em produção, o processamento é assíncrono." -ForegroundColor Cyan
    Write-Host ""
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "   ⚠️  Status Code: $statusCode" -ForegroundColor Yellow
    
    if ($statusCode -eq 401) {
        Write-Host "   ℹ️  Esperado: sem token de autenticação válido" -ForegroundColor Cyan
        Write-Host "   📝 Configure ASAAS_WEBHOOK_SECRET no Vercel" -ForegroundColor Gray
    } elseif ($statusCode -eq 400) {
        Write-Host "   ⚠️  Payload inválido ou estrutura incorreta" -ForegroundColor Yellow
    }
    Write-Host ""
}

# ==========================================
# 3. Verificar logs (instruções)
# ==========================================
Write-Host "`n3️⃣  Verificar Logs no Vercel" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Para ver os logs detalhados:" -ForegroundColor Gray
Write-Host "   1. Acesse: https://vercel.com/ronaldofilardos-projects/qwork/logs" -ForegroundColor White
Write-Host "   2. Procure por: [Asaas Webhook]" -ForegroundColor White
Write-Host ""

# ==========================================
# Resumo Final
# ==========================================
Write-Host "`n══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  RESUMO E PRÓXIMOS PASSOS" -ForegroundColor Cyan  
Write-Host "══════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "STATUS ATUAL:" -ForegroundColor Yellow
Write-Host "✅ Endpoint de webhook está ONLINE em produção" -ForegroundColor Green
Write-Host ""

if (-not $secretConfigured) {
    Write-Host "CONFIGURAÇÃO NECESSÁRIA:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  Variáveis de ambiente precisam ser configuradas no Vercel" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 PASSO A PASSO:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1️⃣  Configurar no Vercel:" -ForegroundColor White
    Write-Host "   https://vercel.com/ronaldofilardos-projects/qwork/settings/environment-variables" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Copie as variáveis do arquivo: .env.production" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Variáveis CRÍTICAS:" -ForegroundColor White
    Write-Host "   • ASAAS_API_KEY" -ForegroundColor Cyan
    Write-Host "   • ASAAS_API_URL" -ForegroundColor Cyan
    Write-Host "   • ASAAS_WEBHOOK_SECRET (⭐ MAIS IMPORTANTE)" -ForegroundColor Cyan
    Write-Host "   • NEXT_PUBLIC_BASE_URL" -ForegroundColor Cyan
    Write-Host "   • NEXT_PUBLIC_APP_URL" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2️⃣  Após configurar, faça REDEPLOY:" -ForegroundColor White
    Write-Host "   • No Vercel: Deployments → Redeploy" -ForegroundColor Gray
    Write-Host "   • Ou: git commit --allow-empty -m 'redeploy' && git push" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3️⃣  Configurar no Asaas Sandbox:" -ForegroundColor White
    Write-Host "   https://sandbox.asaas.com → Configurações → Integrações → Webhooks" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Webhook URL:" -ForegroundColor White
    Write-Host "   $prodUrl/api/webhooks/asaas" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Token: [mesmo valor de ASAAS_WEBHOOK_SECRET]" -ForegroundColor White
    Write-Host ""
    Write-Host "   Eventos:" -ForegroundColor White
    Write-Host "   ✅ PAYMENT_CREATED" -ForegroundColor Gray
    Write-Host "   ✅ PAYMENT_CONFIRMED" -ForegroundColor Gray
    Write-Host "   ✅ PAYMENT_RECEIVED (⭐)" -ForegroundColor Gray
    Write-Host "   ✅ PAYMENT_OVERDUE" -ForegroundColor Gray
    Write-Host "   ✅ PAYMENT_REFUNDED" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4️⃣  Testar novamente:" -ForegroundColor White
    Write-Host "   .\scripts\testar-webhook-producao.ps1" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✅ Sistema configurado corretamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Cyan
    Write-Host "1. Atualizar webhook no Asaas Sandbox" -ForegroundColor White
    Write-Host "2. Fazer um pagamento de teste" -ForegroundColor White
    Write-Host "3. Monitorar logs no Vercel" -ForegroundColor White
    Write-Host ""
}

Write-Host "📚 Documentação: CONFIGURACAO_ASAAS_PRODUCAO.md" -ForegroundColor Cyan
Write-Host ""
