#!/usr/bin/env pwsh
# Script para verificar configuração do Asaas em produção
# Data: 17/02/2026

param(
    [string]$Environment = "production"
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICAÇÃO: Asaas em Produção" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cores
$OK = "Green"
$WARN = "Yellow"
$ERROR = "Red"
$INFO = "Cyan"

# URL de produção esperada
$PROD_URL = "https://qwork-psi.vercel.app"

# Contador de problemas
$issues = 0

# ==========================================
# 1. Verificar arquivo .env.local
# ==========================================
Write-Host "1. Verificando arquivo .env.local..." -ForegroundColor $INFO

if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    
    # Verificar NEXT_PUBLIC_BASE_URL
    if ($envContent -match "NEXT_PUBLIC_BASE_URL\s*=\s*(.+)") {
        $baseUrl = $Matches[1].Trim()
        if ($baseUrl -eq "http://localhost:3000") {
            Write-Host "   ⚠️  NEXT_PUBLIC_BASE_URL ainda aponta para localhost" -ForegroundColor $WARN
            Write-Host "      (Isso é OK se você só configurou no Vercel)" -ForegroundColor Gray
        } else {
            Write-Host "   ✅ NEXT_PUBLIC_BASE_URL: $baseUrl" -ForegroundColor $OK
        }
    } else {
        Write-Host "   ❌ NEXT_PUBLIC_BASE_URL não encontrada" -ForegroundColor $ERROR
        $issues++
    }
    
    # Verificar ASAAS_API_URL
    if ($envContent -match "ASAAS_API_URL\s*=\s*(.+)") {
        $asaasUrl = $Matches[1].Trim()
        if ($asaasUrl -match "sandbox") {
            Write-Host "   ℹ️  Usando Asaas SANDBOX: $asaasUrl" -ForegroundColor $INFO
        } else {
            Write-Host "   ✅ Usando Asaas PRODUÇÃO: $asaasUrl" -ForegroundColor $OK
        }
    } else {
        Write-Host "   ❌ ASAAS_API_URL não encontrada" -ForegroundColor $ERROR
        $issues++
    }
    
    # Verificar ASAAS_API_KEY
    if ($envContent -match "ASAAS_API_KEY") {
        Write-Host "   ✅ ASAAS_API_KEY configurada" -ForegroundColor $OK
    } else {
        Write-Host "   ❌ ASAAS_API_KEY não encontrada" -ForegroundColor $ERROR
        $issues++
    }
    
    # Verificar ASAAS_WEBHOOK_SECRET
    if ($envContent -match "ASAAS_WEBHOOK_SECRET") {
        Write-Host "   ✅ ASAAS_WEBHOOK_SECRET configurada" -ForegroundColor $OK
    } else {
        Write-Host "   ❌ ASAAS_WEBHOOK_SECRET não encontrada" -ForegroundColor $ERROR
        $issues++
    }
} else {
    Write-Host "   ❌ Arquivo .env.local não encontrado" -ForegroundColor $ERROR
    $issues++
}

Write-Host ""

# ==========================================
# 2. Testar endpoint de webhook (Health Check)
# ==========================================
Write-Host "2. Testando endpoint de webhook em produção..." -ForegroundColor $INFO

try {
    $response = Invoke-RestMethod -Uri "$PROD_URL/api/webhooks/asaas" -Method GET -ErrorAction Stop
    
    Write-Host "   ✅ Endpoint acessível" -ForegroundColor $OK
    Write-Host "      Service: $($response.service)" -ForegroundColor Gray
    Write-Host "      Status: $($response.status)" -ForegroundColor Gray
    Write-Host "      Environment: $($response.env)" -ForegroundColor Gray
    
    if ($response.webhookSecretConfigured -eq $true) {
        Write-Host "   ✅ Webhook Secret está configurado" -ForegroundColor $OK
    } else {
        Write-Host "   ❌ Webhook Secret NÃO está configurado" -ForegroundColor $ERROR
        $issues++
    }
} catch {
    Write-Host "   ❌ Erro ao acessar endpoint: $($_.Exception.Message)" -ForegroundColor $ERROR
    $issues++
}

Write-Host ""

# ==========================================
# 3. Verificar configuração no código
# ==========================================
Write-Host "3. Verificando código..." -ForegroundColor $INFO

$criarRoute = "app/api/pagamento/asaas/criar/route.ts"
if (Test-Path $criarRoute) {
    $routeContent = Get-Content $criarRoute -Raw
    
    if ($routeContent -match "NEXT_PUBLIC_BASE_URL|NEXT_PUBLIC_URL") {
        Write-Host "   ✅ Código usa variáveis de ambiente corretas" -ForegroundColor $OK
    } else {
        Write-Host "   ⚠️  Código pode ter URL hardcoded" -ForegroundColor $WARN
    }
} else {
    Write-Host "   ⚠️  Arquivo de rota não encontrado" -ForegroundColor $WARN
}

Write-Host ""

# ==========================================
# 4. Instruções para configurar no Vercel
# ==========================================
Write-Host "4. Configuração no Vercel..." -ForegroundColor $INFO
Write-Host ""
Write-Host "   Para configurar as variáveis de ambiente no Vercel:" -ForegroundColor Gray
Write-Host ""
Write-Host "   1. Acesse: https://vercel.com/ronaldofilardos-projects/qwork/settings/environment-variables" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Adicione/Atualize estas variáveis:" -ForegroundColor Gray
Write-Host "      NEXT_PUBLIC_BASE_URL = $PROD_URL" -ForegroundColor White
Write-Host "      NEXT_PUBLIC_APP_URL  = $PROD_URL" -ForegroundColor White
Write-Host "      NEXT_PUBLIC_URL      = $PROD_URL" -ForegroundColor White
Write-Host ""
Write-Host "   3. Marque os ambientes: Production, Preview, Development" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Salve e faça redeploy" -ForegroundColor Gray
Write-Host ""

# ==========================================
# 5. Instruções para Asaas
# ==========================================
Write-Host "5. Configuração no Painel Asaas Sandbox..." -ForegroundColor $INFO
Write-Host ""
Write-Host "   1. Acesse: https://sandbox.asaas.com" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Vá em: Configurações → Integrações → Webhooks" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Configure a URL do webhook:" -ForegroundColor Gray
Write-Host "      $PROD_URL/api/webhooks/asaas" -ForegroundColor White
Write-Host ""
Write-Host "   4. Token: [mesmo valor de ASAAS_WEBHOOK_SECRET]" -ForegroundColor Gray
Write-Host ""
Write-Host "   5. Marque os eventos:" -ForegroundColor Gray
Write-Host "      ✅ PAYMENT_CREATED" -ForegroundColor Gray
Write-Host "      ✅ PAYMENT_CONFIRMED" -ForegroundColor Gray
Write-Host "      ✅ PAYMENT_RECEIVED (mais importante)" -ForegroundColor Gray
Write-Host "      ✅ PAYMENT_OVERDUE" -ForegroundColor Gray
Write-Host "      ✅ PAYMENT_REFUNDED" -ForegroundColor Gray
Write-Host ""

# ==========================================
# Resumo
# ==========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($issues -eq 0) {
    Write-Host "✅ Tudo configurado corretamente!" -ForegroundColor $OK
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor $INFO
    Write-Host "1. Configurar variáveis de ambiente no Vercel (se ainda não fez)" -ForegroundColor Gray
    Write-Host "2. Atualizar webhook no painel Asaas" -ForegroundColor Gray
    Write-Host "3. Fazer um teste de pagamento" -ForegroundColor Gray
} else {
    Write-Host "❌ Encontrados $issues problema(s)" -ForegroundColor $ERROR
    Write-Host ""
    Write-Host "Revise as mensagens acima e siga as instruções." -ForegroundColor $WARN
}

Write-Host ""
Write-Host "URL de produção: $PROD_URL" -ForegroundColor $INFO
Write-Host "URL do webhook: $PROD_URL/api/webhooks/asaas" -ForegroundColor $INFO
Write-Host ""

# ==========================================
# Teste opcional do webhook
# ==========================================
Write-Host ""
$testWebhook = Read-Host "Deseja testar enviar um webhook de teste? (s/N)"

if ($testWebhook -eq "s" -or $testWebhook -eq "S") {
    Write-Host ""
    Write-Host "Enviando webhook de teste..." -ForegroundColor $INFO
    
    $testPayload = @{
        event = "PAYMENT_RECEIVED"
        payment = @{
            id = "pay_test_" + (Get-Date -Format "yyyyMMddHHmmss")
            status = "RECEIVED"
            value = 1.00
            externalReference = "lote_test_pagamento_test"
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $testResponse = Invoke-RestMethod `
            -Uri "$PROD_URL/api/webhooks/asaas" `
            -Method POST `
            -Body $testPayload `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        Write-Host "   ✅ Webhook de teste enviado com sucesso!" -ForegroundColor $OK
        Write-Host "   Resposta: $($testResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   ⚠️  Webhook retornou status: $statusCode" -ForegroundColor $WARN
        
        if ($statusCode -eq 401) {
            Write-Host "      Isso é esperado se o token não estiver configurado corretamente" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "Documentação completa: CONFIGURACAO_ASAAS_PRODUCAO.md" -ForegroundColor $INFO
Write-Host ""
