
$docsRoot = 'c:/apps/QWork/docs'

# List of all files in docs root except README.md
$filesToMove = Get-ChildItem -Path $docsRoot -File | Where-Object { $_.Name -ne 'README.md' }

foreach ($file in $filesToMove) {
    $fileName = $file.Name
    Write-Host "Moving: $fileName" -ForegroundColor Yellow

    # Determine destination folder based on filename patterns
    switch -Wildcard ($fileName.ToUpper()) {
        'CORRECAO*' { $destFolder = 'corrections' }
        'CORRECOES*' { $destFolder = 'corrections' }
        'SUMARIO*' { $destFolder = 'corrections' }
        'RESUMO*' { $destFolder = 'corrections' }
        'MIGRACAO*' { $destFolder = 'migration' }
        'MIGRATION*' { $destFolder = 'migration' }
        'ANALISE*MIGRACAO*' { $destFolder = 'migration' }
        'CHECKLIST*MIGRACAO*' { $destFolder = 'migration' }
        'RELATORIO*MIGRACAO*' { $destFolder = 'migration' }
        'RELATORIO*SINCRONIZACAO*' { $destFolder = 'migration' }
        'SANITIZACAO*' { $destFolder = 'migration' }
        'TESTS*' { $destFolder = 'testing' }
        'CHECKLIST*TESTES*' { $destFolder = 'testing' }
        'AUDITORIA*' { $destFolder = 'reports' }
        'RELATORIO*AUDITORIA*' { $destFolder = 'reports' }
        'RELATORIO*PERMISSOES*' { $destFolder = 'reports' }
        'RELATORIO*REMOCAO*' { $destFolder = 'reports' }
        'RELATORIO*CODIGO*' { $destFolder = 'reports' }
        'EXECUCAO*PLANO*' { $destFolder = 'reports' }
        'ARCHITECTURE*' { $destFolder = 'architecture' }
        'ARQUITETURA*' { $destFolder = 'architecture' }
        'ESTRUTURA*' { $destFolder = 'architecture' }
        'DIAGRAMA*' { $destFolder = 'architecture' }
        'ANALISE*ENTIDADE*' { $destFolder = 'architecture' }
        'GESTOR*ENTIDADE*' { $destFolder = 'architecture' }
        'REESTRUTURACAO*' { $destFolder = 'architecture' }
        'RELATORIO*ENGENHARIA*' { $destFolder = 'architecture' }
        'RELATORIO*ESTRUTURA*' { $destFolder = 'architecture' }
        'RELATORIO*TABELA*' { $destFolder = 'architecture' }
        'RELATORIO*SISTEMA*SENHAS*' { $destFolder = 'architecture' }
        'GUIA*' { $destFolder = 'guides' }
        'QUICK-START*' { $destFolder = 'guides' }
        'DEVELOPMENT*' { $destFolder = 'guides' }
        'CONFIGURACAO*' { $destFolder = 'guides' }
        'TROUBLESHOOTING*' { $destFolder = 'guides' }
        'EMISSOR*ENV*' { $destFolder = 'guides' }
        'CHECKLIST*ALINHAMENTO*' { $destFolder = 'guides' }
        'IMPLEMENTACAO*' { $destFolder = 'process' }
        'OTIMIZACAO*' { $destFolder = 'process' }
        'MUDANCA*PDF*' { $destFolder = 'process' }
        'UPLOAD*LAUDO*' { $destFolder = 'process' }
        'PLANO*' { $destFolder = 'process' }
        'PROCESSO*' { $destFolder = 'process' }
        'protecao*' { $destFolder = 'process' }
        'RELATORIO*VIOLACAO*' { $destFolder = 'process' }
        'REVISAO*FLUXO*' { $destFolder = 'process' }
        'SUMMARY*' { $destFolder = 'process' }
        'diagnostico*' { $destFolder = 'process' }
        'DIAGNOSTICO*' { $destFolder = 'process' }
        'DATABASE*' { $destFolder = 'policies' }
        'schema*' { $destFolder = 'policies' }
        'ADMIN*' { $destFolder = 'security' }
        default { 
            $destFolder = 'other'
            if (-not (Test-Path (Join-Path $docsRoot $destFolder) -PathType Container)) {
                New-Item -Path (Join-Path $docsRoot $destFolder) -ItemType Directory | Out-Null
            }
        }
    }

    $destinationPath = Join-Path $docsRoot $destFolder
    if (-not (Test-Path $destinationPath -PathType Container)) {
        New-Item -Path $destinationPath -ItemType Directory | Out-Null
    }

    try {
        Move-Item -Path $file.FullName -Destination $destinationPath -Force
        Write-Host "Successfully moved to: $destFolder" -ForegroundColor Green
    } catch {
        Write-Host "Error moving $fileName : $_" -ForegroundColor Red
    }
}

Write-Host "`nFiles in $docsRoot after move:" -ForegroundColor Cyan
Get-ChildItem -Path $docsRoot -File
