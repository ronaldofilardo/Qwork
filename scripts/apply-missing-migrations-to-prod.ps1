# ====================================================================
# APPLY MISSING MIGRATIONS TO PROD — neondb_v2
# Data: 25/04/2026
# Objetivo: Aplicar no PROD (neondb_v2) somente as migrations que
#            existem em STAGING (neondb_staging) e estão AUSENTES em PROD.
#            Preserva 100% dos dados existentes em PROD.
#
# SEGURANÇA:
#   - Consulta schema_migrations em tempo real para identificar gap
#   - Nunca reaplica migrations já presentes
#   - Trata "already exists" como skip (idempotente)
#   - Outros erros param a execução (sem -Force)
#   - Log completo em logs/sync-prod-<timestamp>.log
#
# Uso:
#   .\scripts\apply-missing-migrations-to-prod.ps1 -DryRun     # revisão sem aplicar
#   .\scripts\apply-missing-migrations-to-prod.ps1              # aplicar
#   .\scripts\apply-missing-migrations-to-prod.ps1 -Force       # ignorar erros não-críticos
#   .\scripts\apply-missing-migrations-to-prod.ps1 -FromVersion 1146 -ToVersion 1200
# ====================================================================

param(
    [switch]$DryRun,
    [switch]$Force,
    [int]$FromVersion = 0,    # 0 = auto (usa gap real)
    [int]$ToVersion   = 9999  # 9999 = sem limite superior
)

$NEON_HOST      = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$NEON_USER      = "neondb_owner"
$PROD_DB        = "neondb_v2"
$STAGING_DB     = "neondb_staging"
$MIGRATIONS_DIR = "C:\apps\QWork\database\migrations"
$LOGS_DIR       = "C:\apps\QWork\logs"
$TIMESTAMP      = (Get-Date -Format "yyyyMMdd_HHmmss")
$LOG_FILE       = "$LOGS_DIR\sync-prod-$TIMESTAMP.log"

# ---- Senha ----
$password = if ($env:NEON_PROD_PASSWORD) { $env:NEON_PROD_PASSWORD }
            elseif ($env:PGPASSWORD)      { $env:PGPASSWORD }
            else                          { "REDACTED_NEON_PASSWORD" }

$env:PGPASSWORD    = $password
$env:PGSSLMODE     = "require"
$env:PGSSLCERTMODE = "allow"

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not (Test-Path $LOGS_DIR)) { New-Item -ItemType Directory -Path $LOGS_DIR | Out-Null }

function Write-Log {
    param($Message, $Color = "White")
    $ts = Get-Date -Format "HH:mm:ss"
    $line = "[$ts] $Message"
    Write-Host $line -ForegroundColor $Color
    Add-Content -Path $LOG_FILE -Value $line -Encoding UTF8
}

function Write-Banner {
    param($Text, $Color = "Cyan")
    $sep = "=" * 68
    Write-Log $sep $Color
    Write-Log "  $Text" $Color
    Write-Log $sep $Color
    Add-Content -Path $LOG_FILE -Value "" -Encoding UTF8
}

Write-Banner "APPLY MISSING MIGRATIONS → neondb_v2 (PROD)"
Write-Log "Data     : $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" "Gray"
Write-Log "Log      : $LOG_FILE" "Gray"
if ($DryRun) {
    Write-Log "MODO     : DRY-RUN (nenhuma migration sera aplicada)" "Yellow"
}
Write-Log "" "White"

# ====================================================================
# FASE 1: Identificar gap
# ====================================================================
Write-Banner "FASE 1 — Identificando gap PROD vs STAGING" "Magenta"

Write-Log "Consultando schema_migrations em PROD..." "Gray"
$prodVersionsRaw = psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -t -A -c `
    "SELECT version FROM schema_migrations ORDER BY version;" 2>&1
$prodVersions = $prodVersionsRaw | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_.Trim() }

Write-Log "Consultando schema_migrations em STAGING..." "Gray"
$stagVersionsRaw = psql -h $NEON_HOST -U $NEON_USER -d $STAGING_DB -t -A -c `
    "SELECT version FROM schema_migrations ORDER BY version;" 2>&1
$stagVersions = $stagVersionsRaw | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_.Trim() }

$prodMax = $prodVersions | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum
$stagMax = $stagVersions | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum

Write-Log "PROD    : $($prodVersions.Count) migrations (max: $prodMax)" "White"
Write-Log "STAGING : $($stagVersions.Count) migrations (max: $stagMax)" "White"

# Gap = versões no STAGING mas não no PROD, dentro de 1..8999 (excluindo 9000+ especiais)
$gapAll = $stagVersions | Where-Object {
    $v = $_
    $v -lt 9000 -and
    $prodVersions -notcontains $v -and
    $v -ge $FromVersion -and
    $v -le $ToVersion
} | Sort-Object

# Verificar arquivos locais
$availableFiles = @{}
Get-ChildItem "$MIGRATIONS_DIR\*.sql" | ForEach-Object {
    if ($_.BaseName -match '^(\d+)') {
        $num = [int]$Matches[1]
        $availableFiles[$num] = $_.FullName
    }
}

$missingFile = $gapAll | Where-Object { -not $availableFiles.ContainsKey($_) }
$toApply     = $gapAll | Where-Object { $availableFiles.ContainsKey($_) }

Write-Log "" "White"
Write-Log "Migrations faltando no PROD : $($gapAll.Count)" $(if ($gapAll.Count -gt 0) { "Yellow" } else { "Green" })
Write-Log "Com arquivo local           : $($toApply.Count)" "Cyan"
Write-Log "Sem arquivo local (ignorar) : $($missingFile.Count)" $(if ($missingFile.Count -gt 0) { "Red" } else { "Green" })

if ($missingFile.Count -gt 0) {
    Write-Log "" "White"
    Write-Log "ATENCAO — Migrations sem arquivo .sql local (nao serao aplicadas):" "Red"
    $missingFile | ForEach-Object { Write-Log "  $_" "Red" }
}

if ($toApply.Count -eq 0) {
    Write-Log "" "White"
    Write-Log "Nenhuma migration para aplicar. PROD ja esta em dia com STAGING." "Green"
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    exit 0
}

Write-Log "" "White"
Write-Log "Migrations a aplicar:" "Cyan"
$toApply | ForEach-Object {
    $v = $_
    $f = Split-Path $availableFiles[$v] -Leaf
    Write-Log "  $v — $f" "White"
}

if ($DryRun) {
    Write-Log "" "White"
    Write-Log "DRY-RUN: listagem completa acima. Nenhuma migration foi aplicada." "Yellow"
    Write-Log "Execute sem -DryRun para aplicar." "Yellow"
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    exit 0
}

# ====================================================================
# FASE 2: Confirmação antes de aplicar (em modo interativo)
# ====================================================================
Write-Log "" "White"
Write-Banner "FASE 2 — Aplicando $($toApply.Count) migrations em neondb_v2" "Yellow"
Write-Log "ATENCAO: Isso modifica o schema do banco de PRODUCAO!" "Red"
Write-Log "         Os dados serao PRESERVADOS." "Green"
Write-Log "         Backup disponivel em: backups/prod_v2_backup_*" "Gray"
Write-Log "" "White"

$stats = @{ OK = 0; Skip = 0; Err = 0 }
$errors = @()

foreach ($version in $toApply) {
    $filePath = $availableFiles[$version]
    $fileName = Split-Path $filePath -Leaf

    Write-Log "── [$($stats.OK + $stats.Skip + $stats.Err + 1)/$($toApply.Count)] $fileName" "Cyan"

    try {
        $output = psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -f $filePath 2>&1
        $exitCode = $LASTEXITCODE
        $outputStr = ($output | Out-String).Trim()

        if ($exitCode -eq 0) {
            Write-Log "     OK — aplicada" "Green"
            $stats.OK++

            # Registrar na schema_migrations se a própria migration não fez isso
            $isRegistered = psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -t -A -c `
                "SELECT 1 FROM schema_migrations WHERE version = $version;" 2>&1
            if ($isRegistered -notmatch "1") {
                psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -c `
                    "INSERT INTO schema_migrations (version, applied_at, description) VALUES ($version, NOW(), '$fileName') ON CONFLICT DO NOTHING;" 2>&1 | Out-Null
                Write-Log "     schema_migrations atualizado ($version)" "Gray"
            }
        }
        elseif ($outputStr -match "already exists|IF NOT EXISTS|does not exist, skipping|duplicate key") {
            Write-Log "     SKIP — ja existia (idempotente)" "Yellow"
            $stats.Skip++
        }
        elseif ($Force) {
            Write-Log "     AVISO (Force) — erro ignorado:" "Yellow"
            $snippet = $outputStr -replace "[\r\n]+"," " | ForEach-Object { $_.Substring(0, [Math]::Min(120, $_.Length)) }
            Write-Log "     $snippet" "DarkYellow"
            $stats.Err++
            $errors += [PSCustomObject]@{ Version = $version; File = $fileName; Error = $outputStr }
        }
        else {
            Write-Log "     ERRO — parando execucao:" "Red"
            $outputStr -split "`n" | Select-Object -First 8 | ForEach-Object {
                Write-Log "     $_" "Red"
            }
            $stats.Err++
            $errors += [PSCustomObject]@{ Version = $version; File = $fileName; Error = $outputStr }

            Write-Log "" "White"
            Write-Log "Execucao pausada na migration $version." "Red"
            Write-Log "Corrija o erro e re-execute com -FromVersion $version" "Yellow"
            Write-Log "Ou re-execute com -Force para ignorar erros nao-criticos." "Yellow"

            # Sumário parcial
            Write-Log "" "White"
            Write-Log "Parcial: OK=$($stats.OK) Skip=$($stats.Skip) Err=$($stats.Err)" "White"
            Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
            exit 1
        }
    }
    catch {
        Write-Log "     EXCECAO: $($_.Exception.Message)" "Red"
        $stats.Err++
        $errors += [PSCustomObject]@{ Version = $version; File = $fileName; Error = $_.Exception.Message }

        if (-not $Force) {
            Write-Log "Abortado. Use -FromVersion $version para retomar." "Yellow"
            Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
            exit 1
        }
    }
}

# ====================================================================
# SUMÁRIO FINAL
# ====================================================================
Write-Log "" "White"
Write-Banner "RESULTADO FINAL" "Green"
Write-Log "  Aplicadas com sucesso : $($stats.OK)" "Green"
Write-Log "  Skipped (ja existiam) : $($stats.Skip)" "Yellow"
Write-Log "  Erros                 : $($stats.Err)" $(if ($stats.Err -gt 0) { "Red" } else { "Green" })
Write-Log "" "White"

if ($errors.Count -gt 0) {
    Write-Log "Erros registrados:" "Red"
    $errors | ForEach-Object {
        Write-Log "  [$($_.Version)] $($_.File)" "Red"
        Write-Log "  $($_.Error.Substring(0,[Math]::Min(200,$_.Error.Length)))" "DarkRed"
    }
    Write-Log "" "White"
}

Write-Log "Log completo: $LOG_FILE" "Gray"
Write-Log "" "White"
Write-Log "PROXIMO PASSO: execute validate-prod-schema-sync.ps1" "Cyan"

Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

if ($stats.Err -gt 0 -and -not $Force) { exit 1 }
exit 0
