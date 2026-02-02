# Script para Identificar Arquivos Duplicados
# Identifica scripts com nomes similares mas extensões diferentes

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$scriptsRoot = Split-Path -Parent $PSScriptRoot

Write-Host "🔍 Análise de Duplicados no Diretório /scripts" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

# Obter todos os arquivos de script na raiz
$scriptFiles = Get-ChildItem -Path $scriptsRoot -File | 
    Where-Object { $_.Extension -match '\.(js|ts|cjs|mjs|mts|sql)$' }

# Agrupar por nome base (sem extensão)
$grouped = $scriptFiles | Group-Object { $_.BaseName }

# Encontrar duplicados
$duplicates = $grouped | Where-Object { $_.Count -gt 1 }

if ($duplicates.Count -eq 0) {
    Write-Host "✅ Nenhum arquivo duplicado encontrado na raiz!" -ForegroundColor Green
    exit 0
}

Write-Host "⚠️  Encontrados $($duplicates.Count) conjuntos de arquivos duplicados:`n" -ForegroundColor Yellow

$duplicatesList = @()

foreach ($dup in $duplicates) {
    Write-Host "📄 $($dup.Name)" -ForegroundColor Cyan
    
    $files = @()
    foreach ($file in $dup.Group) {
        $size = [math]::Round($file.Length / 1KB, 2)
        $modified = $file.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
        
        Write-Host "   ├─ $($file.Name) ($size KB, modificado: $modified)" -ForegroundColor Gray
        
        $files += [PSCustomObject]@{
            Name = $file.Name
            Extension = $file.Extension
            Size = $size
            Modified = $file.LastWriteTime
            Path = $file.FullName
        }
    }
    
    # Sugerir qual manter (mais recente e TypeScript preferível)
    $preferred = $files | Sort-Object @{Expression={$_.Extension -eq '.ts'}; Descending=$true}, Modified -Descending | Select-Object -First 1
    $toRemove = $files | Where-Object { $_.Name -ne $preferred.Name }
    
    Write-Host "   └─ 💡 Sugestão: Manter '$($preferred.Name)' (mais recente)" -ForegroundColor Green
    
    if ($toRemove.Count -gt 0) {
        Write-Host "      Considerar remover:" -ForegroundColor Yellow
        foreach ($rem in $toRemove) {
            Write-Host "      - $($rem.Name)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    
    $duplicatesList += [PSCustomObject]@{
        BaseName = $dup.Name
        Files = $files
        Suggested = $preferred.Name
        ToRemove = ($toRemove | ForEach-Object { $_.Name }) -join ", "
    }
}

# ============================================================================
# ANÁLISE DETALHADA DE DUPLICADOS CONHECIDOS
# ============================================================================
Write-Host "`n📋 Análise Detalhada de Duplicados Específicos" -ForegroundColor Magenta
Write-Host "================================================`n" -ForegroundColor Magenta

# Pares conhecidos de duplicados
$knownDuplicates = @(
    @{
        Base = "check-rh-user"
        Files = @("check-rh-user.cjs", "check-rh-user.js")
        Recommendation = "Manter .cjs (CommonJS explícito)"
    },
    @{
        Base = "check_login vs check-login"
        Files = @("check_login.js", "check-login.js")
        Recommendation = "Consolidar em check-login.js (kebab-case é padrão)"
    },
    @{
        Base = "debug-cobranca"
        Files = @("debug-cobranca.cjs", "debug-cobranca.js", "debug-cobranca2.js")
        Recommendation = "Verificar diferenças; possivelmente manter apenas uma versão"
    },
    @{
        Base = "debug_print_lines"
        Files = @("debug_print_lines.cjs", "debug_print_lines.js")
        Recommendation = "Manter .cjs (CommonJS explícito)"
    },
    @{
        Base = "diagnose-lote"
        Files = @("diagnose-lote.cjs", "diagnose-lote.mts")
        Recommendation = "Manter .mts (TypeScript moderno)"
    },
    @{
        Base = "updateFuncionarioHash"
        Files = @("updateFuncionarioHash.cjs", "updateFuncionarioHash.js")
        Recommendation = "Manter .cjs (CommonJS explícito)"
    }
)

foreach ($known in $knownDuplicates) {
    Write-Host "📌 $($known.Base)" -ForegroundColor Cyan
    Write-Host "   Arquivos: $($known.Files -join ', ')" -ForegroundColor Gray
    Write-Host "   ✅ Recomendação: $($known.Recommendation)" -ForegroundColor Green
    Write-Host ""
}

# ============================================================================
# VERIFICAÇÃO DE CONTEÚDO IDÊNTICO
# ============================================================================
Write-Host "`n🔬 Verificação de Conteúdo Idêntico" -ForegroundColor Magenta
Write-Host "====================================`n" -ForegroundColor Magenta

$identicalPairs = @()

foreach ($dup in $duplicates) {
    $files = $dup.Group | Sort-Object Extension
    
    if ($files.Count -eq 2) {
        $content1 = Get-Content $files[0].FullName -Raw -ErrorAction SilentlyContinue
        $content2 = Get-Content $files[1].FullName -Raw -ErrorAction SilentlyContinue
        
        if ($content1 -and $content2) {
            # Normalizar espaços e quebras de linha para comparação
            $normalized1 = $content1 -replace '\s+', ' '
            $normalized2 = $content2 -replace '\s+', ' '
            
            if ($normalized1 -eq $normalized2) {
                Write-Host "✅ IDÊNTICOS: $($files[0].Name) ≡ $($files[1].Name)" -ForegroundColor Green
                $identicalPairs += [PSCustomObject]@{
                    File1 = $files[0].Name
                    File2 = $files[1].Name
                    Status = "Idêntico"
                }
            } else {
                Write-Host "⚠️  DIFERENTES: $($files[0].Name) ≠ $($files[1].Name)" -ForegroundColor Yellow
                $identicalPairs += [PSCustomObject]@{
                    File1 = $files[0].Name
                    File2 = $files[1].Name
                    Status = "Diferente"
                }
            }
        }
    }
}

# ============================================================================
# RECOMENDAÇÕES FINAIS
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 RESUMO E RECOMENDAÇÕES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Total de conjuntos duplicados: $($duplicates.Count)" -ForegroundColor Yellow
Write-Host "Pares idênticos encontrados: $(($identicalPairs | Where-Object { $_.Status -eq 'Idêntico' }).Count)" -ForegroundColor Green
Write-Host "Pares diferentes: $(($identicalPairs | Where-Object { $_.Status -eq 'Diferente' }).Count)" -ForegroundColor Yellow

Write-Host "`n📝 Ações Recomendadas:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Para arquivos IDÊNTICOS:" -ForegroundColor White
Write-Host "   - Remover versão com extensão menos específica (.js)" -ForegroundColor Gray
Write-Host "   - Manter TypeScript (.ts/.mts) quando disponível" -ForegroundColor Gray
Write-Host "   - Manter CommonJS explícito (.cjs) sobre .js" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Para arquivos DIFERENTES:" -ForegroundColor White
Write-Host "   - Revisar código e verificar qual versão é mais atual" -ForegroundColor Gray
Write-Host "   - Consolidar em uma única versão TypeScript se possível" -ForegroundColor Gray
Write-Host "   - Documentar motivo se precisar manter múltiplas versões" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Nomenclatura:" -ForegroundColor White
Write-Host "   - Padronizar em kebab-case (ex: check-login.js)" -ForegroundColor Gray
Write-Host "   - Evitar underscore (ex: check_login.js)" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Próximo passo: Executar './higienizar-scripts.ps1 -DryRun' para simular limpeza" -ForegroundColor Yellow
Write-Host ""

# Exportar relatório JSON
$reportPath = Join-Path $scriptsRoot "cleanup\duplicates-report.json"
$report = @{
    Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    TotalDuplicates = $duplicates.Count
    IdenticalPairs = ($identicalPairs | Where-Object { $_.Status -eq "Idêntico" }).Count
    DifferentPairs = ($identicalPairs | Where-Object { $_.Status -eq "Diferente" }).Count
    Duplicates = $duplicatesList
    IdenticalAnalysis = $identicalPairs
}

$report | ConvertTo-Json -Depth 5 | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "📄 Relatório detalhado salvo em: cleanup/duplicates-report.json" -ForegroundColor Green
