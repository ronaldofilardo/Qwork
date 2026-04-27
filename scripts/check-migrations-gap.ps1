# ====================================================================
# CHECK MIGRATIONS GAP — PROD vs STAGING
# Data: 25/04/2026
# Objetivo: Identificar migrations presentes em STAGING (neondb_staging)
#            que estão AUSENTES em PROD (neondb_v2).
#            NÃO modifica nenhum banco.
# ====================================================================

param(
    [switch]$SaveReport  # Salva relatório em logs/
)

$NEON_HOST   = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$NEON_USER   = "neondb_owner"
$PROD_DB     = "neondb_v2"
$STAGING_DB  = "neondb_staging"
$TIMESTAMP   = (Get-Date -Format "yyyyMMdd_HHmmss")
$MIGRATIONS_DIR = "C:\apps\QWork\database\migrations"

# ---- Senha ----
$password = if ($env:NEON_PROD_PASSWORD) { $env:NEON_PROD_PASSWORD }
            elseif ($env:PGPASSWORD)      { $env:PGPASSWORD }
            else                          { "REDACTED_NEON_PASSWORD" }

$env:PGPASSWORD    = $password
$env:PGSSLMODE     = "require"
$env:PGSSLCERTMODE = "allow"

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  GAP CHECK: neondb_v2 (PROD) vs neondb_staging (STAGING)" -ForegroundColor Cyan
Write-Host "  Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Consultar schema_migrations em ambos ----
Write-Host "Consultando schema_migrations em PROD..." -ForegroundColor Gray
$prodVersionsRaw = psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -t -A -c `
    "SELECT version FROM schema_migrations ORDER BY version;" 2>&1
$prodVersions = $prodVersionsRaw | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_.Trim() }

Write-Host "Consultando schema_migrations em STAGING..." -ForegroundColor Gray
$stagVersionsRaw = psql -h $NEON_HOST -U $NEON_USER -d $STAGING_DB -t -A -c `
    "SELECT version FROM schema_migrations ORDER BY version;" 2>&1
$stagVersions = $stagVersionsRaw | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_.Trim() }

Write-Host ""
Write-Host "  PROD    : $($prodVersions.Count) migrations (max: $($prodVersions | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum))" -ForegroundColor White
Write-Host "  STAGING : $($stagVersions.Count) migrations (max: $($stagVersions | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum))" -ForegroundColor White
Write-Host ""

# ---- Calcular gaps ----
$missingInProd    = $stagVersions | Where-Object { $prodVersions -notcontains $_ } | Sort-Object
$orphansInProd    = $prodVersions | Where-Object { $stagVersions -notcontains $_ } | Sort-Object

# ---- Filtrar apenas migrations "reais" (ignorar 9000+ que são migrations de sync especiais) ----
$missingReal   = $missingInProd | Where-Object { $_ -lt 9000 }
$missingSpecial = $missingInProd | Where-Object { $_ -ge 9000 }

# ---- Verificar quais arquivos existem em database/migrations/ ----
$availableFiles = @{}
Get-ChildItem "$MIGRATIONS_DIR\*.sql" | ForEach-Object {
    if ($_.BaseName -match '^(\d+)') {
        $num = [int]$Matches[1]
        $availableFiles[$num] = $_.Name
    }
}

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  MIGRATIONS FALTANDO NO PROD (presentes em STAGING, ausentes em PROD)" -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Cyan

if ($missingReal.Count -eq 0) {
    Write-Host "  Nenhuma migration faltando! PROD esta em dia." -ForegroundColor Green
} else {
    Write-Host "  Total: $($missingReal.Count) migrations faltando" -ForegroundColor Yellow
    Write-Host ""
    $missingReal | ForEach-Object {
        $v = $_
        $hasFile = $availableFiles.ContainsKey($v)
        $fileName = if ($hasFile) { $availableFiles[$v] } else { "(ARQUIVO NAO ENCONTRADO LOCALMENTE)" }
        $icon = if ($hasFile) { "OK" } else { "!!" }
        Write-Host "  [$icon] $v — $fileName"
    }
}

Write-Host ""

if ($missingSpecial.Count -gt 0) {
    Write-Host "  Migrations especiais (9000+) presentes em STAGING mas ausentes em PROD:" -ForegroundColor Gray
    $missingSpecial | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    Write-Host "  (Ignoradas — sao migrations de sync, nao precisam estar em PROD)" -ForegroundColor DarkGray
    Write-Host ""
}

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  MIGRATIONS ORFAS NO PROD (presentes em PROD, ausentes em STAGING)" -ForegroundColor Magenta
Write-Host "====================================================================" -ForegroundColor Cyan

if ($orphansInProd.Count -eq 0) {
    Write-Host "  Nenhuma migration orfa. OK." -ForegroundColor Green
} else {
    Write-Host "  Total: $($orphansInProd.Count) migrations orfas (ATENCAO — revisar antes de sincronizar)" -ForegroundColor Yellow
    $orphansInProd | ForEach-Object { Write-Host "    $_" }
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  ARQUIVOS LOCAIS FALTANDO (migrations no STAGING sem arquivo .sql)" -ForegroundColor Red
Write-Host "====================================================================" -ForegroundColor Cyan
$missingFiles = $missingReal | Where-Object { -not $availableFiles.ContainsKey($_) }
if ($missingFiles.Count -eq 0) {
    Write-Host "  Todos os arquivos encontrados localmente. OK." -ForegroundColor Green
} else {
    Write-Host "  ATENCAO: as seguintes migrations nao tem arquivo .sql local:" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
    Write-Host "  Essas NAO poderao ser aplicadas automaticamente." -ForegroundColor Red
}

Write-Host ""

# ---- Sumário final ----
$applyable = $missingReal | Where-Object { $availableFiles.ContainsKey($_) }

Write-Host "====================================================================" -ForegroundColor Green
Write-Host "  RESUMO" -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Green
Write-Host "  PROD max migration   : $($prodVersions | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum)" -ForegroundColor White
Write-Host "  STAGING max migration: $($stagVersions | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum)" -ForegroundColor White
Write-Host "  Faltando no PROD     : $($missingReal.Count)" -ForegroundColor $(if ($missingReal.Count -gt 0) { "Yellow" } else { "Green" })
Write-Host "  Aplicaveis agora     : $($applyable.Count)" -ForegroundColor $(if ($applyable.Count -gt 0) { "Cyan" } else { "Green" })
Write-Host "  Sem arquivo local    : $($missingFiles.Count)" -ForegroundColor $(if ($missingFiles.Count -gt 0) { "Red" } else { "Green" })
Write-Host "  Orfas no PROD        : $($orphansInProd.Count)" -ForegroundColor $(if ($orphansInProd.Count -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

if ($applyable.Count -gt 0) {
    Write-Host "  PROXIMO PASSO: execute apply-missing-migrations-to-prod.ps1" -ForegroundColor Cyan
    Write-Host "    Primeiro em dry-run:" -ForegroundColor Gray
    Write-Host "    .\scripts\apply-missing-migrations-to-prod.ps1 -DryRun" -ForegroundColor Gray
    Write-Host "    Depois para aplicar:" -ForegroundColor Gray
    Write-Host "    .\scripts\apply-missing-migrations-to-prod.ps1" -ForegroundColor Gray
}

# ---- Salvar relatório ----
if ($SaveReport) {
    $logDir = "C:\apps\QWork\logs"
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
    $reportPath = "$logDir\gap-report-$TIMESTAMP.txt"
    @"
GAP REPORT — $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')
PROD    : neondb_v2  ($($prodVersions.Count) migrations, max $($prodVersions | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum))
STAGING : neondb_staging ($($stagVersions.Count) migrations, max $($stagVersions | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum))

FALTANDO NO PROD ($($missingReal.Count)):
$($missingReal -join "`n")

ORFAS NO PROD ($($orphansInProd.Count)):
$($orphansInProd -join "`n")

SEM ARQUIVO LOCAL ($($missingFiles.Count)):
$($missingFiles -join "`n")
"@ | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Host "  Relatorio salvo em: $reportPath" -ForegroundColor Gray
}

Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

# Retornar código de saída baseado em se há migrations faltando
if ($missingFiles.Count -gt 0) { exit 2 }   # arquivos locais faltando
elseif ($missingReal.Count -gt 0) { exit 1 } # migrations faltando (normal — aplicar)
else { exit 0 }                               # em dia
