# Script para testar a API de pendências com autenticação
# Primeiro, fazer login para obter a sessão

$baseUrl = "http://localhost:3000"

# Credenciais de teste (ajuste conforme necessário)
$loginData = @{
    perfil = "rh"
    cpf = "00000000000"  # Admin
    senha = "admin123"
} | ConvertTo-Json

Write-Host "🔐 Fazendo login..."
try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -SessionVariable session
    Write-Host "✅ Login realizado com sucesso!"
} catch {
    Write-Host "❌ Erro no login: $($_.Exception.Message)"
    exit 1
}

Write-Host "📋 Testando API de pendências..."
try {
    $pendenciasResponse = Invoke-WebRequest -Uri "$baseUrl/api/rh/pendencias?empresa_id=1" -Method GET -WebSession $session
    $pendencias = $pendenciasResponse.Content | ConvertFrom-Json

    Write-Host "✅ API funcionando!"
    Write-Host "📊 Total de anomalias encontradas: $($pendencias.anomalias.Count)"

    if ($pendencias.anomalias.Count -gt 0) {
        Write-Host "📋 Primeira anomalia:"
        $pendencias.anomalias[0] | Format-List
    } else {
        Write-Host "ℹ️ Nenhuma anomalia encontrada"
    }

} catch {
    Write-Host "❌ Erro na API de pendências: $($_.Exception.Message)"
}