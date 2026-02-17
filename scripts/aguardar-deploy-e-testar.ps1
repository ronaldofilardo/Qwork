#!/usr/bin/env pwsh
# Script para aguardar deploy e testar automaticamente
# Data: 17/02/2026

param(
    [int]$MaxWaitMinutes = 5
)

$prodUrl = "https://qwork-psi.vercel.app"
$maxAttempts = $MaxWaitMinutes * 4  # 4 tentativas por minuto
$attempt = 0

Write-Host "`n╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  AGUARDANDO DEPLOY E TESTANDO WEBHOOK                               ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "⏳ Aguardando 30 segundos para o deploy iniciar...$n" -ForegroundColor Yellow
Start-Sleep -Seconds 30

while ($attempt -lt $maxAttempts) {
    $attempt++
    
    Write-Host "[$attempt/$maxAttempts] Testando webhook..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$prodUrl/api/webhooks/asaas" -Method GET -ErrorAction Stop
        
        if ($response.webhookSecretConfigured -eq $true) {
            Write-Host "`n╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
            Write-Host "║  ✅ SUCESSO! WEBHOOK CONFIGURADO CORRETAMENTE                       ║" -ForegroundColor Green
            Write-Host "╚══════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
            
            Write-Host "📋 Configuração:" -ForegroundColor Cyan
            Write-Host "   Service: $($response.service)" -ForegroundColor White
            Write-Host "   Status: $($response.status)" -ForegroundColor White
            Write-Host "   Environment: $($response.env)" -ForegroundColor White
            Write-Host "   Webhook Secret Configured: $($response.webhookSecretConfigured)" -ForegroundColor Green
            Write-Host ""
            
            Write-Host "🎉 PRONTO PARA USO!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📝 PRÓXIMO PASSO:" -ForegroundColor Yellow
            Write-Host "   Configure o webhook no Asaas Sandbox:" -ForegroundColor White
            Write-Host "   https://sandbox.asaas.com → Configurações → Webhooks" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "   URL: $prodUrl/api/webhooks/asaas" -ForegroundColor White
            Write-Host "   Token: qwork_webhook_secret_prod_2026_a7b9c3d5e8f1g2h4i6j8k0l2m4n6p8q0" -ForegroundColor Green
            Write-Host ""
            
            exit 0
        }
        
        Write-Host "   Webhook Secret: False (aguardando deploy...)" -ForegroundColor Yellow
        
    } catch {
        Write-Host "   Erro ao conectar (normal durante deploy)" -ForegroundColor Gray
    }
    
    if ($attempt -lt $maxAttempts) {
        Write-Host "   Aguardando 15 segundos...`n" -ForegroundColor Gray
        Start-Sleep -Seconds 15
    }
}

Write-Host "`n⚠️  Tempo limite atingido ($MaxWaitMinutes minutos)" -ForegroundColor Yellow
Write-Host ""
Write-Host "O deploy pode estar demorando mais que o esperado." -ForegroundColor White
Write-Host "Verifique manualmente:" -ForegroundColor White
Write-Host "https://vercel.com/ronaldofilardos-projects/qwork" -ForegroundColor Cyan
Write-Host ""
Write-Host "Depois teste com:" -ForegroundColor White
Write-Host ".\scripts\testar-webhook-producao.ps1" -ForegroundColor Cyan
Write-Host ""
