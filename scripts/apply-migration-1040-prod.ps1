#!/usr/bin/env pwsh
# Script: apply-migration-1040-prod.ps1
# Descrição: Aplica migration 1040 (reset_senha_tokens) em Staging e PROD (Neon)
#
# Uso:
#   $env:DATABASE_URL_STAGING="postgresql://...@.../neondb_staging"
#   $env:DATABASE_URL_PROD="postgresql://...@.../neondb"
#   .\scripts\apply-migration-1040-prod.ps1
#
# Ou com parâmetros:
#   .\scripts\apply-migration-1040-prod.ps1 -TargetEnv staging
#   .\scripts\apply-migration-1040-prod.ps1 -TargetEnv prod

param(
    [ValidateSet("staging", "prod", "all")]
    [string]$TargetEnv = "all",
    [switch]$DryRun = $false
)

$MigrationFile = "database/migrations/1040_reset_senha_tokens.sql"

if (-not (Test-Path $MigrationFile)) {
    Write-Error "Arquivo de migração não encontrado: $MigrationFile"
    exit 1
}

$StagingUrl = $env:DATABASE_URL_STAGING
$ProdUrl    = $env:DATABASE_URL_PROD

function Apply-Migration {
    param(
        [string]$EnvName,
        [string]$ConnectionString
    )

    if (-not $ConnectionString) {
        Write-Error "[$EnvName] CONNECTION STRING não definida. Configure a variável de ambiente DATABASE_URL_$(($EnvName).ToUpper())."
        return $false
    }

    Write-Host "`n=== Aplicando migration 1040 em $EnvName ==="

    if ($DryRun) {
        Write-Host "[DRY-RUN] Pulando execução real em $EnvName."
        return $true
    }

    $env:PGPASSWORD = ""  # psql usa CONNECTION STRING completa; PGPASSWORD fica vazio
    $result = psql $ConnectionString -f $MigrationFile 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[$EnvName] ERRO ao aplicar migration:`n$result"
        return $false
    }
    Write-Host "[$EnvName] ✅ Migration 1040 aplicada com sucesso."
    Write-Host $result
    return $true
}

$ok = $true

if ($TargetEnv -eq "staging" -or $TargetEnv -eq "all") {
    $ok = Apply-Migration -EnvName "STAGING" -ConnectionString $StagingUrl
}

if ($TargetEnv -eq "prod" -or $TargetEnv -eq "all") {
    if ($TargetEnv -eq "all" -and -not $ok) {
        Write-Warning "Pulando PROD devido a falha em STAGING."
    } else {
        $ok = Apply-Migration -EnvName "PROD" -ConnectionString $ProdUrl
    }
}

if ($ok) {
    Write-Host "`n✅ Migration 1040 concluída."
} else {
    Write-Error "Migration 1040 falhou em um ou mais ambientes."
    exit 1
}
