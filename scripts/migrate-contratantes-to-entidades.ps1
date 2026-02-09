#!/usr/bin/env pwsh
<#
.SYNOPSIS
Script automatizado para completar a migração tomadores → entidades

.DESCRIPTION
Este script atualiza os arquivos restantes da migração que ainda referenciam
"contratante" ao invés de "entidade". Deve ser revisado e executado com cautela.

.NOTES
Sempre faça backup antes de executar!
Revisar cada mudança após execução.
#>

$ErrorActionPreference = "Stop"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Migração tomadores → Entidades" -ForegroundColor Cyan
Write-Host "Script de Atualização Automática" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Diretório base
$baseDir = "C:\apps\QWork"
Set-Location $baseDir

# Backup timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "$baseDir\backup_migration_$timestamp"

Write-Host "1. Criando backup em: $backupDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Arquivos a atualizar
$filesToUpdate = @(
    "app\api\entidade\liberar-lote\route.ts",
    "app\api\entidade\parcelas\gerar-recibo\route.ts",
    "app\api\entidade\parcelas\download-recibo\route.ts",
    "app\api\entidade\empresas\route.ts",
    "app\api\entidade\lote\[id]\relatorio-individual\route.ts",
    "app\api\entidade\lote\[id]\relatorio\route.ts",
    "app\api\contratante\verificar-pagamento\route.ts"
)

Write-Host "2. Fazendo backup dos arquivos..." -ForegroundColor Yellow
foreach ($file in $filesToUpdate) {
    $fullPath = Join-Path $baseDir $file
    if (Test-Path $fullPath) {
        $backupPath = Join-Path $backupDir $file
        $backupParent = Split-Path $backupPath -Parent
        New-Item -ItemType Directory -Path $backupParent -Force | Out-Null
        Copy-Item $fullPath $backupPath -Force
        Write-Host "  ✓ Backup: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "3. Aplicando substituições..." -ForegroundColor Yellow

# Mapeamento de substituições (ordem importa!)
$replacements = @(
    @{
        Pattern = 'session\.contratante_id'
        Replacement = 'session.entidade_id'
        Description = 'Session ID'
    },
    @{
        Pattern = 'const contratanteId = '
        Replacement = 'const entidadeId = '
        Description = 'Variável contratanteId'
    },
    @{
        Pattern = '\[contratanteId,'
        Replacement = '[entidadeId,'
        Description = 'Parâmetro em array'
    },
    @{
        Pattern = '\(contratanteId,'
        Replacement = '(entidadeId,'
        Description = 'Parâmetro em função'
    },
    @{
        Pattern = ' contratanteId\)'
        Replacement = ' entidadeId)'
        Description = 'Parâmetro final'
    },
    @{
        Pattern = 'f\.contratante_id'
        Replacement = 'f.entidade_id'
        Description = 'Coluna funcionarios'
    },
    @{
        Pattern = 'func\.contratante_id'
        Replacement = 'func.entidade_id'
        Description = 'Alias func'
    },
    @{
        Pattern = 'la\.contratante_id'
        Replacement = 'la.entidade_id'
        Description = 'Alias lotes_avaliacao'
    },
    @{
        Pattern = 'FROM tomadores '
        Replacement = 'FROM entidades '
        Description = 'Tabela FROM'
    },
    @{
        Pattern = 'JOIN tomadores '
        Replacement = 'JOIN entidades '
        Description = 'Tabela JOIN'
    },
    @{
        Pattern = 'tomadores ct'
        Replacement = 'entidades e'
        Description = 'Alias de tabela'
    },
    @{
        Pattern = 'ct\.nome as contratante_nome'
        Replacement = 'e.nome as entidade_nome'
        Description = 'Alias de coluna nome'
    },
    @{
        Pattern = 'ct\.cnpj as contratante_cnpj'
        Replacement = 'e.cnpj as entidade_cnpj'
        Description = 'Alias de coluna cnpj'
    },
    @{
        Pattern = 'ct\.email as contratante_email'
        Replacement = 'e.email as entidade_email'
        Description = 'Alias de coluna email'
    },
    @{
        Pattern = 'co\.contratante_id'
        Replacement = 'co.entidade_id'
        Description = 'Alias contratos'
    },
    @{
        Pattern = 'p\.contratante_id'
        Replacement = 'p.entidade_id'
        Description = 'Alias pagamentos'
    },
    @{
        Pattern = 'contratante_id:'
        Replacement = 'entidade_id:'
        Description = 'Propriedade de objeto'
    },
    @{
        Pattern = 'dados\.contratante_'
        Replacement = 'dados.entidade_'
        Description = 'Dados de contratante'
    },
    @{
        Pattern = 'INSERT INTO lotes_avaliacao \(contratante_id,'
        Replacement = 'INSERT INTO lotes_avaliacao (entidade_id,'
        Description = 'INSERT lotes'
    },
    @{
        Pattern = 'WHERE contratante_id = '
        Replacement = 'WHERE entidade_id = '
        Description = 'WHERE clause'
    },
    @{
        Pattern = 'AND contratante_id = '
        Replacement = 'AND entidade_id = '
        Description = 'AND clause'
    },
    @{
        Pattern = '/\* Entity usa contratante_id'
        Replacement = '/* Entity usa entidade_id'
        Description = 'Comentário'
    },
    @{
        Pattern = '// Entity usa contratante_id'
        Replacement = '// Entity usa entidade_id'
        Description = 'Comentário'
    },
    @{
        Pattern = 'lote de contratante'
        Replacement = 'lote de entidade'
        Description = 'Comentário descritivo'
    },
    @{
        Pattern = 'contratante\s+\(não'
        Replacement = 'entidade (não'
        Description = 'Comentário XOR'
    }
)

$totalChanges = 0

foreach ($file in $filesToUpdate) {
    $fullPath = Join-Path $baseDir $file
    if (-not (Test-Path $fullPath)) {
        Write-Host "  ⚠ Arquivo não encontrado: $file" -ForegroundColor Yellow
        continue
    }

    Write-Host ""
    Write-Host "  Processando: $file" -ForegroundColor Cyan
    
    $content = Get-Content $fullPath -Raw -Encoding UTF8
    $originalContent = $content
    $fileChanges = 0

    foreach ($repl in $replacements) {
        $matches = [regex]::Matches($content, $repl.Pattern)
        if ($matches.Count -gt 0) {
            $content = $content -replace $repl.Pattern, $repl.Replacement
            $fileChanges += $matches.Count
            Write-Host "    ✓ $($matches.Count)x: $($repl.Description)" -ForegroundColor Green
        }
    }

    if ($fileChanges -gt 0) {
        Set-Content $fullPath $content -Encoding UTF8 -NoNewline
        $totalChanges += $fileChanges
        Write-Host "    Total: $fileChanges substituições" -ForegroundColor White
    } else {
        Write-Host "    Nenhuma alteração necessária" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Resumo da Migração" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Total de substituições: $totalChanges" -ForegroundColor White
Write-Host "Backup criado em: $backupDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠ IMPORTANTE: Revisar todas as mudanças!" -ForegroundColor Red
Write-Host "  1. Verificar compilação TypeScript" -ForegroundColor Yellow
Write-Host "  2. Executar testes" -ForegroundColor Yellow
Write-Host "  3. Revisar diffs no Git" -ForegroundColor Yellow
Write-Host ""
Write-Host "✓ Script concluído com sucesso!" -ForegroundColor Green
