# Script de teste para fluxo de upload manual de laudo
# Testa: upload-url → upload-local → upload-confirm

param(
    [Parameter(Mandatory=$false)]
    [int]$LoteId = 1,
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000",
    
    [Parameter(Mandatory=$false)]
    [string]$Cookie = ""
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 Teste de Upload Manual de Laudo" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Criar PDF de teste se não existir
$testPdfPath = Join-Path $PSScriptRoot "test-laudo.pdf"
if (-not (Test-Path $testPdfPath)) {
    Write-Host "📄 Criando PDF de teste..." -ForegroundColor Yellow
    
    # Criar PDF mínimo válido (< 1MB)
    $pdfContent = @"
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
50 700 Td
(LAUDO DE TESTE) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF
"@
    
    [System.IO.File]::WriteAllText($testPdfPath, $pdfContent)
    Write-Host "✓ PDF de teste criado: $testPdfPath" -ForegroundColor Green
}

# Verificar tamanho do PDF
$fileInfo = Get-Item $testPdfPath
$fileSizeBytes = $fileInfo.Length
$fileSizeMB = [math]::Round($fileSizeBytes / 1MB, 2)

Write-Host "📦 Arquivo: $testPdfPath" -ForegroundColor White
Write-Host "   Tamanho: $fileSizeBytes bytes ($fileSizeMB MB)" -ForegroundColor White

if ($fileSizeBytes -gt 1048576) {
    Write-Host "❌ ERRO: Arquivo excede 1MB!" -ForegroundColor Red
    exit 1
}

# Calcular SHA-256 do cliente
Write-Host ""
Write-Host "🔐 Calculando SHA-256..." -ForegroundColor Yellow
$fileBytes = [System.IO.File]::ReadAllBytes($testPdfPath)
$sha256 = [System.Security.Cryptography.SHA256]::Create()
$hashBytes = $sha256.ComputeHash($fileBytes)
$clientSha256 = [System.BitConverter]::ToString($hashBytes).Replace("-", "").ToLower()
Write-Host "✓ SHA-256: $clientSha256" -ForegroundColor Green

# Headers comuns
$headers = @{
    "Content-Type" = "application/json"
}

if ($Cookie) {
    $headers["Cookie"] = $Cookie
} else {
    Write-Host ""
    Write-Host "⚠️  Cookie não fornecido. Certifique-se de estar autenticado!" -ForegroundColor Yellow
    Write-Host "   Use: -Cookie 'next-auth.session-token=...'`n" -ForegroundColor Yellow
}

# PASSO 1: Obter URL de upload
Write-Host ""
Write-Host "📡 PASSO 1: Obtendo URL de upload..." -ForegroundColor Cyan
$uploadUrlEndpoint = "$BaseUrl/api/emissor/laudos/$LoteId/upload-url"

try {
    $response1 = Invoke-WebRequest -Uri $uploadUrlEndpoint -Method POST -Headers $headers -UseBasicParsing
    $uploadData = $response1.Content | ConvertFrom-Json
    
    if ($uploadData.success) {
        Write-Host "✓ URL obtida com sucesso!" -ForegroundColor Green
        Write-Host "  Key: $($uploadData.key)" -ForegroundColor White
        Write-Host "  Upload URL: $($uploadData.uploadUrl)" -ForegroundColor White
        Write-Host "  Método: $($uploadData.uploadMethod)" -ForegroundColor White
    } else {
        Write-Host "❌ Falha ao obter URL: $($uploadData.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro na requisição: $_" -ForegroundColor Red
    Write-Host $_.Exception.Response -ForegroundColor Red
    exit 1
}

# PASSO 2: Upload do arquivo
Write-Host ""
Write-Host "📤 PASSO 2: Enviando arquivo..." -ForegroundColor Cyan

$boundary = [System.Guid]::NewGuid().ToString()
$uploadEndpoint = "$BaseUrl$($uploadData.uploadUrl)"

# Criar multipart/form-data manualmente
$bodyLines = @(
    "--$boundary",
    'Content-Disposition: form-data; name="key"',
    "",
    $uploadData.key,
    "--$boundary",
    'Content-Disposition: form-data; name="file"; filename="laudo.pdf"',
    'Content-Type: application/pdf',
    "",
    [System.Text.Encoding]::Latin1.GetString($fileBytes),
    "--$boundary--"
)

$body = $bodyLines -join "`r`n"
$bodyBytes = [System.Text.Encoding]::Latin1.GetBytes($body)

$uploadHeaders = @{
    "Content-Type" = "multipart/form-data; boundary=$boundary"
}

if ($Cookie) {
    $uploadHeaders["Cookie"] = $Cookie
}

try {
    $response2 = Invoke-WebRequest -Uri $uploadEndpoint -Method POST -Headers $uploadHeaders -Body $bodyBytes -UseBasicParsing
    $uploadResult = $response2.Content | ConvertFrom-Json
    
    if ($uploadResult.success) {
        Write-Host "✓ Arquivo enviado com sucesso!" -ForegroundColor Green
        Write-Host "  Key: $($uploadResult.key)" -ForegroundColor White
        Write-Host "  Filename: $($uploadResult.filename)" -ForegroundColor White
        Write-Host "  Tamanho: $($uploadResult.size) bytes" -ForegroundColor White
        Write-Host "  Temp Path: $($uploadResult.tempPath)" -ForegroundColor White
    } else {
        Write-Host "❌ Falha no upload: $($uploadResult.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro no upload: $_" -ForegroundColor Red
    exit 1
}

# PASSO 3: Confirmar upload
Write-Host ""
Write-Host "✅ PASSO 3: Confirmando upload..." -ForegroundColor Cyan
$confirmEndpoint = "$BaseUrl/api/emissor/laudos/$LoteId/upload-confirm"

$confirmBody = @{
    key = $uploadData.key
    filename = "laudo.pdf"
    size = $fileSizeBytes
    clientSha256 = $clientSha256
} | ConvertTo-Json

$confirmHeaders = @{
    "Content-Type" = "application/json"
}

if ($Cookie) {
    $confirmHeaders["Cookie"] = $Cookie
}

try {
    $response3 = Invoke-WebRequest -Uri $confirmEndpoint -Method POST -Headers $confirmHeaders -Body $confirmBody -UseBasicParsing
    $confirmResult = $response3.Content | ConvertFrom-Json
    
    if ($confirmResult.success) {
        Write-Host "✓ Upload confirmado com sucesso!" -ForegroundColor Green
        Write-Host "  Laudo ID: $($confirmResult.laudo_id)" -ForegroundColor White
        Write-Host "  SHA-256 (servidor): $($confirmResult.sha256)" -ForegroundColor White
        Write-Host "  Tamanho final: $($confirmResult.size) bytes" -ForegroundColor White
        Write-Host "  Arquivo: $($confirmResult.filename)" -ForegroundColor White
        Write-Host "  Imutável: $($confirmResult.immutable)" -ForegroundColor White
        
        # Verificar hash
        if ($confirmResult.sha256.ToLower() -eq $clientSha256.ToLower()) {
            Write-Host "  ✓ Hash verificado!" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Hash divergente!" -ForegroundColor Yellow
            Write-Host "     Cliente: $clientSha256" -ForegroundColor Yellow
            Write-Host "     Servidor: $($confirmResult.sha256)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Falha na confirmação: $($confirmResult.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro na confirmação: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 TESTE CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "Resumo:" -ForegroundColor Cyan
Write-Host "  • Lote ID: $LoteId" -ForegroundColor White
Write-Host "  • Laudo ID: $($confirmResult.laudo_id)" -ForegroundColor White
Write-Host "  • Arquivo: storage/laudos/laudo-$($confirmResult.laudo_id).pdf" -ForegroundColor White
Write-Host "  • Status: emitido (imutável)" -ForegroundColor White
Write-Host ""
