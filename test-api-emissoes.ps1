# Script para testar API de emissões
Write-Host "`n=== TESTE: API /api/admin/emissoes ===" -ForegroundColor Cyan

# 1. Testar banco direto
Write-Host "`n1. Verificando view v_solicitacoes_emissao no banco..." -ForegroundColor Yellow
$env:PGPASSWORD='npg_J2QYqn5oxCzp'
psql "postgresql://neondb_owner@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT COUNT(*) as total FROM v_solicitacoes_emissao;"

Write-Host "`n2. Listando lotes na view..." -ForegroundColor Yellow
psql "postgresql://neondb_owner@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT lote_id, status_pagamento, empresa_nome FROM v_solicitacoes_emissao ORDER BY lote_id DESC LIMIT 5;"

# 2. Testar API (se estiver rodando localmente)
Write-Host "`n3. Testando API REST (certifique-se de que o servidor está rodando)..." -ForegroundColor Yellow
Write-Host "   URL: http://localhost:3000/api/admin/emissoes" -ForegroundColor Gray

try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/emissoes" -Method GET -Headers $headers -UseBasicParsing
    
    Write-Host "`n   Status Code: $($response.StatusCode)" -ForegroundColor Green
    
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "   Total de Solicitações: $($data.total)" -ForegroundColor Green
    
    if ($data.solicitacoes -and $data.solicitacoes.Count -gt 0) {
        Write-Host "`n   Solicitações encontradas:" -ForegroundColor Green
        $data.solicitacoes | ForEach-Object {
            Write-Host "   - Lote $($_.lote_id): $($_.status_pagamento) - $($_.empresa_nome)" -ForegroundColor White
        }
    } else {
        Write-Host "`n   ⚠️  PROBLEMA: API retornou array vazio!" -ForegroundColor Red
        Write-Host "   Response completo:" -ForegroundColor Red
        Write-Host $response.Content -ForegroundColor Gray
    }
    
} catch {
    Write-Host "`n   ❌ ERRO ao chamar API:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response Body: $responseBody" -ForegroundColor Gray
    }
    
    Write-Host "`n   Possíveis causas:" -ForegroundColor Yellow
    Write-Host "   - Servidor não está rodando (npm run dev)" -ForegroundColor Gray
    Write-Host "   - Não está autenticado como admin" -ForegroundColor Gray
    Write-Host "   - Problema de CORS" -ForegroundColor Gray
}

Write-Host "`n=== FIM DO TESTE ===" -ForegroundColor Cyan
Write-Host "`nInstruções:" -ForegroundColor Yellow
Write-Host "1. Certifique-se de que o servidor está rodando: npm run dev" -ForegroundColor White
Write-Host "2. Faça login como admin no navegador" -ForegroundColor White
Write-Host "3. Abra o Console do navegador (F12) e veja se há erros" -ForegroundColor White
Write-Host "4. Verifique a aba Network para ver a requisição /api/admin/emissoes`n" -ForegroundColor White
