# Script para testar cadastro de contratante
Write-Host "Testando cadastro de contratante..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/cadastro/contratante" `
        -Method POST `
        -Form @{
            tipo="clinica"
            nome="Clinica Powershell Test"
            cnpj="44.555.666/0001-77"
            email="pstest@clinic.xyz"
            telefone="11922223333"
            endereco="PS Test Street 500"
            cidade="Sao Paulo"
            estado="SP"
            cep="04004000"
            plano_id="1"
            numero_funcionarios_estimado="35"
            responsavel_nome="PowerShell Tester"
            responsavel_cpf="33344455566"
            responsavel_email="pstester@clinic.xyz"
            responsavel_celular="11933334444"
        }

    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.Content
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Response Body: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}
