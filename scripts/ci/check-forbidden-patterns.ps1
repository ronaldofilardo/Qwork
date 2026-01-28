# ==============================================================================
# Script de Verificação de Padrões Proibidos em Testes (PowerShell)
# Implementa validações da Política de Qualidade de Código em Testes
# @see docs/testing/QUALITY-POLICY.md
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "🔍 Verificando padrões proibidos em testes (QUALITY-POLICY.md)..." -ForegroundColor Cyan
Write-Host ""

$exitCode = 0

# ==============================================================================
# 1. Verifica @ts-nocheck sem justificativa (Issue #XXXX ou Ticket:)
# ==============================================================================
Write-Host "📋 [1/5] Verificando @ts-nocheck sem justificativa..." -ForegroundColor Cyan

$nocheckFiles = Get-ChildItem -Path "__tests__" -Recurse -File | Where-Object {
    (Get-Content $_.FullName -Raw) -match "@ts-nocheck"
}

if ($nocheckFiles) {
    Write-Host "⚠️  Arquivos com @ts-nocheck encontrados:" -ForegroundColor Yellow
    
    foreach ($file in $nocheckFiles) {
        $content = Get-Content $file.FullName -Raw
        
        # Verifica se tem justificativa (Issue #, Ticket:, JIRA-)
        if ($content -notmatch "(Issue #|Ticket:|JIRA-)") {
            Write-Host "   ❌ $($file.FullName) - SEM JUSTIFICATIVA" -ForegroundColor Red
            Write-Host "      Adicione comentário: // @ts-nocheck - Issue #XXXX: motivo" -ForegroundColor Yellow
            $exitCode = 1
        } else {
            Write-Host "   ✓ $($file.FullName) - com justificativa" -ForegroundColor Green
        }
    }
} else {
    Write-Host "✅ Nenhum @ts-nocheck encontrado" -ForegroundColor Green
}

Write-Host ""

# ==============================================================================
# 2. Conta uso excessivo de 'any' em testes (limite: 50 ocorrências totais)
# ==============================================================================
Write-Host "📋 [2/5] Verificando uso de 'any'..." -ForegroundColor Cyan

$anyMatches = Get-ChildItem -Path "__tests__" -Recurse -File -Include "*.ts","*.tsx" | ForEach-Object {
    Select-String -Path $_.FullName -Pattern ": any" -AllMatches
}

$anyCount = ($anyMatches | Measure-Object).Count
$anyLimit = 50

if ($anyCount -gt $anyLimit) {
    Write-Host "❌ Uso excessivo de 'any' em testes: $anyCount ocorrências (limite: $anyLimit)" -ForegroundColor Red
    Write-Host "   Top 5 arquivos com mais 'any':" -ForegroundColor Yellow
    
    $anyMatches | Group-Object Path | 
        Sort-Object Count -Descending | 
        Select-Object -First 5 | 
        ForEach-Object { Write-Host "      $($_.Count) - $($_.Name)" -ForegroundColor Yellow }
    
    Write-Host "   Ação: Substituir 'any' por tipos explícitos ou 'unknown'" -ForegroundColor Yellow
    $exitCode = 1
} else {
    Write-Host "✅ Uso de 'any' dentro do limite: $anyCount/$anyLimit" -ForegroundColor Green
}

Write-Host ""

# ==============================================================================
# 3. Verifica require() em arquivos TypeScript
# ==============================================================================
Write-Host "📋 [3/5] Verificando require() em arquivos .ts/.tsx..." -ForegroundColor Cyan

$requireFiles = Get-ChildItem -Path "__tests__" -Recurse -File -Include "*.ts","*.tsx" | Where-Object {
    (Get-Content $_.FullName -Raw) -match "require\("
}

if ($requireFiles) {
    Write-Host "❌ Arquivos com require() encontrados (use import):" -ForegroundColor Red
    foreach ($file in $requireFiles) {
        Write-Host "   ❌ $($file.FullName)" -ForegroundColor Red
        
        # Mostra primeiras 3 ocorrências
        $matches = Select-String -Path $file.FullName -Pattern "require\(" | Select-Object -First 3
        $matches | ForEach-Object { Write-Host "      Linha $($_.LineNumber): $($_.Line.Trim())" -ForegroundColor Yellow }
    }
    Write-Host "   Ação: Substituir require() por import" -ForegroundColor Yellow
    $exitCode = 1
} else {
    Write-Host "✅ Nenhum require() em arquivos TypeScript" -ForegroundColor Green
}

Write-Host ""

# ==============================================================================
# 4. Verifica funções async sem await
# ==============================================================================
Write-Host "📋 [4/5] Verificando async sem await..." -ForegroundColor Cyan

$asyncFiles = Get-ChildItem -Path "__tests__" -Recurse -File -Include "*.ts","*.tsx"
$suspiciousAsync = @()

foreach ($file in $asyncFiles) {
    $lines = Get-Content $file.FullName
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "async\s*\(") {
            # Verifica próximas 10 linhas
            $nextLines = $lines[$i..([Math]::Min($i + 10, $lines.Count - 1))] -join "`n"
            
            # Se não tem await e não tem comentário justificativo
            if ($nextLines -notmatch "await" -and $nextLines -notmatch "async intencional") {
                $suspiciousAsync += "$($file.FullName):$($i + 1)"
            }
        }
    }
}

if ($suspiciousAsync) {
    Write-Host "⚠️  Funções async sem await encontradas:" -ForegroundColor Yellow
    $suspiciousAsync | ForEach-Object { Write-Host "   ⚠️  $_" -ForegroundColor Yellow }
    Write-Host "   Ação: Remover 'async' ou adicionar comentário '// async intencional: motivo'" -ForegroundColor Yellow
    # Não bloqueia (warning only)
} else {
    Write-Host "✅ Funções async verificadas" -ForegroundColor Green
}

Write-Host ""

# ==============================================================================
# 5. Relatório de métricas de qualidade
# ==============================================================================
Write-Host "📋 [5/5] Gerando métricas de qualidade..." -ForegroundColor Cyan

$testFiles = Get-ChildItem -Path "__tests__" -Recurse -File -Include "*.test.ts","*.test.tsx"
$totalTests = ($testFiles | Measure-Object).Count
$totalLines = ($testFiles | Get-Content | Measure-Object -Line).Lines

Write-Host "📊 Métricas:" -ForegroundColor Green
Write-Host "   • Total de arquivos de teste: $totalTests"
Write-Host "   • Total de linhas: $totalLines"
Write-Host "   • Ocorrências de 'any': $anyCount"
Write-Host "   • Arquivos com @ts-nocheck: $(($nocheckFiles | Measure-Object).Count)"

Write-Host ""

# ==============================================================================
# Resultado Final
# ==============================================================================
if ($exitCode -eq 0) {
    Write-Host "✅ Verificação de padrões aprovada!" -ForegroundColor Green
    Write-Host "   Todos os testes estão em conformidade com QUALITY-POLICY.md" -ForegroundColor Green
} else {
    Write-Host "❌ Verificação falhou - Correções necessárias" -ForegroundColor Red
    Write-Host "   📖 Consulte: docs/testing/QUALITY-POLICY.md" -ForegroundColor Yellow
}

exit $exitCode
