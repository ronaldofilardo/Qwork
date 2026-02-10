# ============================================================================
# Script: Diagnóstico do Problema de Fluxo de Pagamento
# Data: 10/02/2026
# Uso: .\diagnostico_completo.ps1 [-Lote 1005] [-Aplicar]
# ============================================================================

param(
    [int]$Lote = 1005,
    [switch]$Aplicar = $false
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DIAGNÓSTICO: Fluxo Pagamento/Emissão" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está em PROD ou DEV
$env:NOME = if ($env:DATABASE_URL -match "neon") { "PRODUÇÃO" } else { "DESENVOLVIMENTO" }

Write-Host "Ambiente: " -NoNewline
Write-Host $env:NOME -ForegroundColor Yellow
Write-Host "Lote sendo analisado: " -NoNewline
Write-Host $Lote -ForegroundColor Yellow
Write-Host ""

# Perguntar confirmação se for PROD
if ($env:NOME -eq "PRODUÇÃO" -and $Aplicar) {
    Write-Host "⚠️  ATENÇÃO: Você está prestes a APLICAR correções em PRODUÇÃO!" -ForegroundColor Red
    Write-Host ""
    $confirmacao = Read-Host "Digite 'CONFIRMO' para continuar"
    
    if ($confirmacao -ne "CONFIRMO") {
        Write-Host "❌ Operação cancelada" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Executando diagnóstico..." -ForegroundColor Green
Write-Host ""

# Executar SQL de diagnóstico
if (Test-Path ".\diagnostico_lote_1005.sql") {
    Write-Host "📊 Executando queries de diagnóstico..." -ForegroundColor Cyan
    
    # Usar psql se disponível
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        psql $env:DATABASE_URL -f ".\diagnostico_lote_1005.sql"
    } else {
        Write-Host "❌ psql não encontrado. Por favor, execute manualmente:" -ForegroundColor Red
        Write-Host "   psql `$env:DATABASE_URL -f .\diagnostico_lote_1005.sql" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Arquivo diagnostico_lote_1005.sql não encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan

# Aplicar correções se solicitado
if ($Aplicar) {
    Write-Host ""
    Write-Host "🔧 APLICANDO CORREÇÕES..." -ForegroundColor Yellow
    Write-Host ""
    
    if (Test-Path ".\database\migrations\1100_fix_premature_laudo_creation.sql") {
        Write-Host "Aplicando Migration 1100..." -ForegroundColor Cyan
        
        if (Get-Command psql -ErrorAction SilentlyContinue) {
            psql $env:DATABASE_URL -f ".\database\migrations\1100_fix_premature_laudo_creation.sql"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Migration aplicada com sucesso!" -ForegroundColor Green
            } else {
                Write-Host "❌ Erro ao aplicar migration!" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "❌ psql não encontrado" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Migration 1100 não encontrada" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DIAGNÓSTICO COMPLETO" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Review o diagnóstico acima" -ForegroundColor White
Write-Host "2. Analise o estado do lote $Lote" -ForegroundColor White
Write-Host "3. Verifique se há laudos em rascunho órfãos" -ForegroundColor White

if (-not $Aplicar) {
    Write-Host ""
    Write-Host "Para APLICAR as correções, execute:" -ForegroundColor Yellow
    Write-Host "   .\diagnostico_completo.ps1 -Lote $Lote -Aplicar" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✅ Correções aplicadas!" -ForegroundColor Green
    Write-Host ""
    Write-Host "4. Teste o fluxo completo:" -ForegroundColor White
    Write-Host "   - Solicitar emissão de um novo lote" -ForegroundColor Gray
    Write-Host "   - Admin definir valor" -ForegroundColor Gray
    Write-Host "   - Admin gerar link" -ForegroundColor Gray
    Write-Host "   - Confirmar pagamento" -ForegroundColor Gray
    Write-Host "   - Emissor ver lote e gerar laudo" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
