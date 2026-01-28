# Replace terminology script: Lotes -> Ciclos (UI-only)
# Run with PowerShell in repo root

$patterns = @(
    @{old='📋 Lotes de avaliações'; new='📋 Ciclos de Coletas Avaliativas'},
    @{old='Lotes de Avaliações'; new='Ciclos de Coletas Avaliativas'},
    @{old='Lote de Avaliação'; new='Ciclo de Coletas Avaliativas'},
    @{old='Liberar Novo Lote'; new='Iniciar Novo Ciclo'},
    @{old='Liberar Lote de Avaliações'; new='Iniciar Ciclo de Coletas Avaliativas'},
    @{old='Liberar Lote'; new='Iniciar Ciclo'},
    @{old='Nenhum lote encontrado'; new='Nenhum ciclo encontrado'},
    @{old='Lotes de avaliações'; new='Ciclos de Coletas Avaliativas'}
)

$paths = @('app','components','__tests__','cypress','docs')

Write-Host "Starting replacements..." -ForegroundColor Cyan

foreach ($p in $paths) {
    Get-ChildItem -Path $p -Include *.tsx,*.ts,*.md,*.cy.ts,*.test.tsx,*.test.ts -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch 'node_modules|\.next|dist|build' } |
    ForEach-Object {
        $file = $_.FullName
        try {
            $content = Get-Content $file -Raw -Encoding UTF8
            $orig = $content
            foreach ($pat in $patterns) {
                $content = $content -replace [regex]::Escape($pat.old), $pat.new
            }
            if ($content -ne $orig) {
                Set-Content -Path $file -Value $content -Encoding UTF8
                Write-Host "Updated: $file" -ForegroundColor Green
            }
        } catch {
            Write-Host ("Failed to process {0}: {1}" -f $file, $_) -ForegroundColor Yellow
        }
    }
}

Write-Host "Replacements complete." -ForegroundColor Cyan
