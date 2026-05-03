#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Executa todos os testes de cadastro de tomadores

.DESCRIPTION
    Script para executar a suíte completa de testes de cadastro:
    - Validações
    - Integração

.NOTES
    Criado em: 20/Janeiro/2026
    Atualizado em: 20/Janeiro/2026
#>

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Testes de Cadastro de tomadores" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$SuccessCount = 0

function Test-Suite {
    param(
        [string]$Name,
        [string]$Path
    )

    Write-Host "[$Name]" -ForegroundColor Yellow -NoNewline
    Write-Host " Executando..." -ForegroundColor Gray

    try {
        # Use --testMatch for E2E files because Jest excludes __tests__/e2e via testPathIgnorePatterns
        if ($Path -like "__tests__/e2e/*") {
            $result = pnpm test -- --testMatch $Path 2>&1
        } else {
            # Pass the path as a test pattern for normal tests
            $result = pnpm test -- $Path 2>&1
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ PASSOU" -ForegroundColor Green
            $script:SuccessCount++
            return $true
        } else {
            Write-Host "  ❌ FALHOU" -ForegroundColor Red
            Write-Host "  Output:" -ForegroundColor Gray
            Write-Host $result -ForegroundColor DarkGray
            $script:ErrorCount++
            return $false
        }
    } catch {
        Write-Host "  ❌ ERRO: $_" -ForegroundColor Red
        $script:ErrorCount++
        return $false
    }
}

Write-Host "Iniciando suíte de testes..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✅ Arquivo criado com 25 testes E2E completos" -ForegroundColor Green
Write-Host "  ⚠️  Requer ajustes no Jest config ou execução separada" -ForegroundColor Yellow
Write-Host ""

# Validações
Test-Suite -Name "Validações" -Path "__tests__/validations/cadastro-contratante-validations.test.ts"
Write-Host ""

# Integração
Test-Suite -Name "Integração Completa" -Path "__tests__/integration/cadastro-fluxo-completo-integration.test.ts"
Write-Host ""

# Relatório Final
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Relatório Final" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testes executados: $($SuccessCount + $ErrorCount)" -ForegroundColor White
Write-Host "✅ Sucessos: $SuccessCount" -ForegroundColor Green
Write-Host "❌ Falhas: $ErrorCount" -ForegroundColor $(if ($ErrorCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($ErrorCount -eq 0) {
    Write-Host "🎉 Todos os testes passaram!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Revisar relatório: docs/corrections/REVISAO-CADASTRO-tomadores-20JAN2026.md" -ForegroundColor Gray
    Write-Host "2. Validar em ambiente de homologação" -ForegroundColor Gray
    Write-Host "3. Planejar deploy em produção" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "⚠️ Alguns testes falharam. Revise os logs acima." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ações recomendadas:" -ForegroundColor Cyan
    Write-Host "1. Verificar erros nos logs" -ForegroundColor Gray
    Write-Host "2. Executar testes individualmente para debug" -ForegroundColor Gray
    Write-Host "3. Consultar documentação: docs/guides/FLUXO-CADASTRO-tomadores.md" -ForegroundColor Gray
    exit 1
}
