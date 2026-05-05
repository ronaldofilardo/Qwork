# Script para sincronizar variáveis SMTP de .env.production para Vercel Production
# Uso: .\sync-smtp-vercel.ps1

param(
    [string]$EnvFile = ".env.production",
    [switch]$Force = $false
)

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $($Message.PadRight(54)) ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Check-VercelCLI {
    Write-Host "Verificando Vercel CLI..." -ForegroundColor Cyan
    try {
        $vercelVersion = & vercel --version 2>$null
        Write-Success "Vercel CLI encontrado: $vercelVersion"
        return $true
    }
    catch {
        Write-Error-Custom "Vercel CLI não está instalado ou não está no PATH"
        Write-Host "Instale com: npm install -g vercel" -ForegroundColor Yellow
        return $false
    }
}

function Check-EnvFile {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        Write-Error-Custom "Arquivo $Path não encontrado"
        return $false
    }
    Write-Success "Arquivo $Path encontrado"
    return $true
}

function Read-SMTPVariables {
    param([string]$Path)
    
    $smtpVars = @{
        "SMTP_HOST" = $null
        "SMTP_PORT" = $null
        "SMTP_USER" = $null
        "SMTP_PASSWORD" = $null
        "NOTIFY_EMAIL" = $null
    }
    
    Write-Host "Lendo variáveis de $Path..." -ForegroundColor Cyan
    
    $content = Get-Content $Path -Raw
    
    # Criar cópia das keys para iterar (evita erro de collection modified)
    $keyList = @("SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "NOTIFY_EMAIL")
    
    foreach ($key in $keyList) {
        # Padrão: VAR_NAME=value (pode ter espaços antes/depois do =)
        $pattern = "^\s*$key\s*=\s*(.+?)\s*$"
        $lines = $content -split "`n"
        $found = $false
        
        foreach ($line in $lines) {
            if ($line -match $pattern) {
                $value = $matches[1].Trim()
                # Remove aspas se existirem
                if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
                if ($value.StartsWith("'") -and $value.EndsWith("'")) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
                $smtpVars[$key] = $value
                $displayValue = if ($key -eq "SMTP_PASSWORD") { 
                    "*" * [Math]::Min($value.Length, 4) + "..." 
                } else { 
                    $value 
                }
                Write-Host "  $key = $displayValue" -ForegroundColor Gray
                $found = $true
                break
            }
        }
        
        if (-not $found) {
            Write-Warning-Custom "Variável $key não encontrada em $Path"
        }
    }
    
    return $smtpVars
}

function Validate-SMTPVariables {
    param([hashtable]$Variables)
    
    $missing = @()
    foreach ($key in $Variables.Keys) {
        if ([string]::IsNullOrWhiteSpace($Variables[$key])) {
            $missing += $key
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Error-Custom "Variáveis faltando: $($missing -join ', ')"
        return $false
    }
    
    Write-Success "Todas as 5 variáveis SMTP estão presentes"
    return $true
}

function Push-ToVercelProduction {
    param(
        [hashtable]$Variables,
        [bool]$ForceFlag
    )
    
    Write-Header "Sincronizando com Vercel Production"
    
    $successCount = 0
    $failedVars = @()
    
    foreach ($key in $Variables.Keys) {
        $value = $Variables[$key]
        
        Write-Host "Adicionando $key a Production..." -ForegroundColor Cyan
        
        try {
            # Comando: vercel env add <name> <value> <environment> --yes
            # O flag --yes evita prompts interativos
            $output = & vercel env add $key $value production --yes 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "$key adicionado com sucesso em Production"
                $successCount++
            }
            else {
                Write-Warning-Custom "$key retornou status $LASTEXITCODE"
                if ($output) {
                    Write-Host "  Resposta: $($output -join ' ')" -ForegroundColor Gray
                }
                $failedVars += $key
            }
        }
        catch {
            Write-Error-Custom "Erro ao adicionar $key : $_"
            $failedVars += $key
        }
        
        Start-Sleep -Milliseconds 500
    }
    
    Write-Header "Resumo de Sincronização"
    Write-Success "$successCount de $($Variables.Count) variáveis sincronizadas"
    
    if ($failedVars.Count -gt 0) {
        Write-Warning-Custom "Falhas: $($failedVars -join ', ')"
        if (-not $ForceFlag) {
            Write-Host "Dica: Execute novamente com -Force se erros forem temporários" -ForegroundColor Yellow
        }
    }
    
    return ($failedVars.Count -eq 0)
}

function List-VercelProduction {
    Write-Header "Variáveis em Vercel Production"
    
    try {
        Write-Host "Conectando ao Vercel..." -ForegroundColor Cyan
        $output = & vercel env list production 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host $output -ForegroundColor Green
        }
        else {
            Write-Warning-Custom "Não foi possível listar as variáveis"
            Write-Host "Execute manualmente: vercel env list production" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Warning-Custom "Erro ao listar variáveis: $_"
    }
}

function Show-NextSteps {
    Write-Header "Próximos Passos"
    Write-Host "1. Confirme que as 5 variáveis estão em Production:" -ForegroundColor White
    Write-Host "   vercel env list production" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Aguarde deploy automático (1-2 minutos)" -ForegroundColor White
    Write-Host "   Vercel redeploya automaticamente quando env vars mudam" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Teste as três situações em Production:" -ForegroundColor White
    Write-Host "   - Aceite de contrato de prestação de serviço" -ForegroundColor Gray
    Write-Host "   - Solicitação de emissão de laudo" -ForegroundColor Gray
    Write-Host "   - Lote liberado para emissor gerar laudo" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Verifique se ronaldofilardo@gmail.com recebe os emails (2-5 min)" -ForegroundColor White
    Write-Host ""
    Write-Host "5. Se falhar, verifique logs em Sentry ou Vercel Logs" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================
# MAIN EXECUTION
# ============================================

Write-Header "SYNC SMTP PARA VERCEL PRODUCTION"

# Step 1: Verificar CLI
if (-not (Check-VercelCLI)) {
    exit 1
}

# Step 2: Verificar arquivo .env.production
if (-not (Check-EnvFile $EnvFile)) {
    exit 1
}

# Step 3: Ler variáveis
$smtpVars = Read-SMTPVariables $EnvFile

# Step 4: Validar variáveis
if (-not (Validate-SMTPVariables $smtpVars)) {
    exit 1
}

# Step 5: Confirmar com usuário
Write-Host ""
Write-Host "Você está prestes a adicionar 5 variáveis SMTP a Production no Vercel." -ForegroundColor Yellow
Write-Host "Certifique-se de que está autenticado: vercel login" -ForegroundColor Yellow
Write-Host ""
if (-not $Force) {
    $response = Read-Host "Deseja continuar? (s/n)"
    if ($response -ne "s" -and $response -ne "sim" -and $response -ne "S") {
        Write-Host "Cancelado pelo usuário." -ForegroundColor Yellow
        exit 0
    }
}

# Step 6: Push para Vercel Production
$success = Push-ToVercelProduction $smtpVars $Force

# Step 7: Listar variáveis em Production
List-VercelProduction

# Step 8: Instruções finais
Show-NextSteps

if ($success) {
    Write-Host "✓ Script concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Aguarde 1-2 minutos para Vercel redeployar com as novas variáveis." -ForegroundColor Cyan
    exit 0
}
else {
    Write-Host "✗ Script concluído com erros. Verifique acima." -ForegroundColor Red
    exit 1
}
