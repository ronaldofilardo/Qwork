# ====================================================================
# SYNC DEV → STAGING (Full Overwrite)
# Data: 2026-04-21
# Branch: feature/v2
#
# Objetivo: Replicar EXATAMENTE o banco local de desenvolvimento
#           (nr-bps_db) no banco de staging do Neon Cloud
#           (neondb_staging), incluindo schema, dados, senhas,
#           FKs, constraints, migrations e tudo mais.
#
# ATENÇÃO: Esta operação APAGA TODOS OS DADOS do staging antes
#          de restaurar os dados do DEV. Não é reversível a não
#          ser pelo backup schema-only gerado automaticamente.
#
# Credenciais: lidas de .env.local na raiz do projeto.
#   - LOCAL_DATABASE_URL   → banco de desenvolvimento local
#   - STAGING_DATABASE_URL → banco de homologação no Neon Cloud
#
# Uso:
#   .\scripts\sync-dev-to-staging.ps1
#   .\scripts\sync-dev-to-staging.ps1 -SkipBackup      (pula backup do staging)
#   .\scripts\sync-dev-to-staging.ps1 -SkipCleanup     (mantém arquivo de dump)
#   .\scripts\sync-dev-to-staging.ps1 -DryRun           (apenas valida, não executa)
# ====================================================================

param(
    [switch]$SkipBackup,    # Pula o backup schema-only do staging antes do overwrite
    [switch]$SkipCleanup,   # Mantém o arquivo de dump após a conclusão
    [switch]$DryRun,        # Apenas valida configuração, não executa nenhuma operação
    [switch]$Force          # Pula a confirmação interativa (uso programático)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ============================================================
# FUNÇÕES AUXILIARES
# ============================================================

function Write-Step {
    param([string]$n, [string]$msg)
    Write-Host ""
    Write-Host "  [$n] $msg" -ForegroundColor Cyan
    Write-Host "  " + ("─" * 60) -ForegroundColor DarkGray
}

function Write-Ok   { param([string]$msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg) Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Err  { param([string]$msg) Write-Host "  ✗ $msg" -ForegroundColor Red }
function Write-Info { param([string]$msg) Write-Host "    $msg" -ForegroundColor Gray }

# ============================================================
# ETAPA 0: CARREGAR CREDENCIAIS DO .env.local
# ============================================================

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Err "Arquivo .env.local não encontrado em: $projectRoot"
    Write-Err "Crie o arquivo com LOCAL_DATABASE_URL e STAGING_DATABASE_URL"
    exit 1
}

Write-Host ""
Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "   SYNC DEV → STAGING — Full Overwrite" -ForegroundColor Magenta
Write-Host "   Origem : nr-bps_db (localhost)" -ForegroundColor Gray
Write-Host "   Destino: neondb_staging (Neon Cloud)" -ForegroundColor Gray
Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta

Write-Step "0" "Carregando credenciais de .env.local"
Write-Info "Arquivo: $envFile"

$LOCAL_DATABASE_URL   = $null
$STAGING_DATABASE_URL = $null

Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -match '^LOCAL_DATABASE_URL\s*=\s*(.+)$') {
        $LOCAL_DATABASE_URL = $Matches[1].Trim('"').Trim("'")
    }
    if ($line -match '^STAGING_DATABASE_URL\s*=\s*(.+)$') {
        $STAGING_DATABASE_URL = $Matches[1].Trim('"').Trim("'")
    }
}

if (-not $LOCAL_DATABASE_URL) {
    Write-Err "LOCAL_DATABASE_URL não encontrada em .env.local"
    exit 1
}
if (-not $STAGING_DATABASE_URL) {
    Write-Err "STAGING_DATABASE_URL não encontrada em .env.local"
    exit 1
}

# Extrair host do staging para exibição (sem credenciais)
$stagingDisplay = ($STAGING_DATABASE_URL -split '@')[1] -split '\?' | Select-Object -First 1
$localDisplay   = ($LOCAL_DATABASE_URL  -split '@')[-1]

Write-Ok "LOCAL_DATABASE_URL  → $localDisplay"
Write-Ok "STAGING_DATABASE_URL → $stagingDisplay"

if ($DryRun) {
    Write-Warn "MODO DRY-RUN: configuração OK. Nenhuma operação será executada."
    Write-Host ""
    exit 0
}

# ============================================================
# ETAPA 1: VERIFICAR FERRAMENTAS (pg_dump / psql)
# ============================================================

Write-Step "1" "Verificando ferramentas PostgreSQL"

foreach ($tool in @("pg_dump", "psql")) {
    try {
        $null = & $tool --version 2>&1
        if ($LASTEXITCODE -ne 0) { throw "exit code $LASTEXITCODE" }
        Write-Ok "$tool disponível"
    } catch {
        Write-Err "$tool não encontrado no PATH"
        Write-Err "Instale o cliente PostgreSQL e adicione ao PATH"
        exit 1
    }
}

# ============================================================
# ETAPA 2: BACKUP SCHEMA-ONLY DO STAGING (pré-overwrite)
# ============================================================

$backupsDir  = Join-Path $projectRoot "backups"
$timestamp   = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFile    = Join-Path $backupsDir "dev-dump-$timestamp.sql"
$backupFile  = Join-Path $backupsDir "staging-pre-sync-$timestamp-schema-only.sql"

if (-not (Test-Path $backupsDir)) {
    New-Item -ItemType Directory -Path $backupsDir | Out-Null
}

if (-not $SkipBackup) {
    Write-Step "2" "Backup schema-only do staging antes do overwrite"
    Write-Info "Destino: backups\staging-pre-sync-$timestamp-schema-only.sql"

    $env:PGSSLMODE     = "require"
    $env:PGSSLCERTMODE = "allow"

    try {
        & pg_dump `
            "--dbname=$STAGING_DATABASE_URL" `
            "--schema-only" `
            "--no-owner" `
            "--no-acl" `
            "--file=$backupFile" 2>&1 | ForEach-Object { Write-Info $_ }

        if ($LASTEXITCODE -ne 0) { throw "pg_dump falhou com código $LASTEXITCODE" }
        Write-Ok "Backup do staging salvo em: $backupFile"
    } catch {
        Write-Warn "Falha ao fazer backup do staging (pode estar vazio/corrompido): $_"
        Write-Warn "Continuando sem backup do staging..."
    }
} else {
    Write-Warn "Backup do staging IGNORADO (--SkipBackup)"
}

# ============================================================
# ETAPA 3: DUMP COMPLETO DO BANCO LOCAL DEV
# ============================================================

Write-Step "3" "Dump completo do banco DEV local (nr-bps_db)"
Write-Info "Destino: backups\dev-dump-$timestamp.sql"
Write-Info "Flags: --clean --if-exists --no-owner --no-acl"

# Credenciais locais (sem SSL)
Remove-Item Env:\PGSSLMODE     -ErrorAction SilentlyContinue
Remove-Item Env:\PGSSLCERTMODE -ErrorAction SilentlyContinue

try {
    & pg_dump `
        "--dbname=$LOCAL_DATABASE_URL" `
        "--file=$dumpFile" `
        "--clean" `
        "--if-exists" `
        "--no-owner" `
        "--no-acl" `
        "--verbose" 2>&1 | ForEach-Object {
            if ($_ -match "^pg_dump: dumping") { Write-Info $_ }
        }

    if ($LASTEXITCODE -ne 0) { throw "pg_dump falhou com código $LASTEXITCODE" }

    $dumpSize = (Get-Item $dumpFile).Length / 1MB
    Write-Ok "Dump concluído: $([math]::Round($dumpSize, 2)) MB"
} catch {
    Write-Err "Falha ao fazer dump do banco local: $_"
    exit 1
}

# ============================================================
# ETAPA 4: LIMPEZA DE RLS POLICIES PROBLEMÁTICAS NO DUMP
# ============================================================

Write-Step "4" "Limpando RLS policies problemáticas do dump"
Write-Info "Baseado em: scripts/database/pre-restore-dump-cleanup.sh"

$policiesToRemove = @(
    'CREATE POLICY admin_all_',
    'CREATE POLICY clinicas_admin_all',
    'CREATE POLICY tomadores_admin_all',
    'CREATE POLICY lotes_emissor_select',
    'CREATE POLICY admin_restricted_funcionarios'
)

$dumpContent = Get-Content $dumpFile -Raw -Encoding UTF8
$removedCount = 0

foreach ($policy in $policiesToRemove) {
    # Remove linhas que iniciam com o padrão da policy
    $pattern = "(?m)^[^\r\n]*" + [regex]::Escape($policy) + "[^\r\n]*\r?\n?"
    $matches_found = ([regex]::Matches($dumpContent, $pattern)).Count
    if ($matches_found -gt 0) {
        $dumpContent = [regex]::Replace($dumpContent, $pattern, "")
        $removedCount += $matches_found
        Write-Info "Removida: $policy ($matches_found ocorrência(s))"
    }
}

if ($removedCount -gt 0) {
    Set-Content -Path $dumpFile -Value $dumpContent -Encoding UTF8 -NoNewline
    Write-Ok "$removedCount policy(ies) problemática(s) removida(s) do dump"
} else {
    Write-Ok "Nenhuma policy problemática encontrada no dump"
}

# ============================================================
# ETAPA 5: CONFIRMAÇÃO DO USUÁRIO
# ============================================================

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "  ║  ⚠  ATENÇÃO — OPERAÇÃO DESTRUTIVA                           ║" -ForegroundColor Red
Write-Host "  ║                                                              ║" -ForegroundColor Red
Write-Host "  ║  O banco de STAGING será COMPLETAMENTE SOBRESCRITO.          ║" -ForegroundColor Red
Write-Host "  ║  TODOS os dados atuais de staging serão APAGADOS.            ║" -ForegroundColor Red
Write-Host "  ║                                                              ║" -ForegroundColor Red
Write-Host "  ║  Destino: $stagingDisplay" -ForegroundColor Yellow
Write-Host "  ║                                                              ║" -ForegroundColor Red
Write-Host "  ╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""
if (-not $Force) {
    $confirm = Read-Host "  Digite 'SIM' para confirmar o overwrite do staging"
    if ($confirm -ne "SIM") {
        Write-Warn "Operacao cancelada. Dump salvo em: $dumpFile"
        exit 0
    }
} else {
    Write-Warn "Confirmacao automatica via -Force. Executando overwrite..."
}

# ============================================================
# ETAPA 6: RESTORE NO STAGING
# ============================================================

Write-Step "6" "Restaurando dump no banco de staging"
Write-Info "Destino: $stagingDisplay"

$env:PGSSLMODE     = "require"
$env:PGSSLCERTMODE = "allow"

# Contar linhas do dump para feedback
$totalLines = (Get-Content $dumpFile | Measure-Object -Line).Lines
Write-Info "Total de linhas no dump: $totalLines"

$restoreErrors = @()

try {
    & psql `
        "--dbname=$STAGING_DATABASE_URL" `
        "--file=$dumpFile" `
        "--set=ON_ERROR_STOP=0" 2>&1 | ForEach-Object {
            $line = "$_"
            if ($line -match "^ERROR:") {
                $restoreErrors += $line
                Write-Warn "  $line"
            } elseif ($line -match "^psql:.*ERROR") {
                $restoreErrors += $line
            }
        }

    if ($LASTEXITCODE -ne 0 -and $restoreErrors.Count -gt 10) {
        throw "psql retornou código $LASTEXITCODE com $($restoreErrors.Count) erros críticos"
    }

    Write-Ok "Restore concluído"
    if ($restoreErrors.Count -gt 0) {
        Write-Warn "$($restoreErrors.Count) aviso(s)/erro(s) não-críticos durante restore (DROP IF EXISTS são normais)"
    }
} catch {
    Write-Err "Falha durante o restore: $_"
    Write-Err "Arquivo de dump preservado em: $dumpFile"
    exit 1
}

# ============================================================
# ETAPA 7: VERIFICAÇÃO PÓS-RESTORE
# ============================================================

Write-Step "7" "Verificação pós-restore"

$validationQueries = @(
    @{ label = "Migrations aplicadas"; query = "SELECT count(*) FROM schema_migrations;" }
    @{ label = "Tabelas no schema public"; query = "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" }
    @{ label = "Total de usuários (funcionarios)"; query = "SELECT count(*) FROM funcionarios;" }
    @{ label = "RLS ativo nas tabelas"; query = "SELECT count(*) FROM pg_tables WHERE schemaname='public' AND rowsecurity=true;" }
)

$validationOk = $true
foreach ($q in $validationQueries) {
    try {
        $result = echo $q.query | psql "--dbname=$STAGING_DATABASE_URL" --tuples-only --no-align 2>&1
        $result = $result.Trim()
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "$($q.label): $result"
        } else {
            Write-Warn "Falha ao verificar: $($q.label)"
            $validationOk = $false
        }
    } catch {
        Write-Warn "Erro ao executar validação '$($q.label)': $_"
        $validationOk = $false
    }
}

# ============================================================
# ETAPA 8: LIMPEZA DO ARQUIVO DE DUMP
# ============================================================

if (-not $SkipCleanup) {
    Write-Step "8" "Limpeza do arquivo de dump temporário"
    try {
        Remove-Item $dumpFile -Force
        Write-Ok "Arquivo de dump removido: $dumpFile"
    } catch {
        Write-Warn "Não foi possível remover o dump: $_"
    }
} else {
    Write-Warn "Arquivo de dump mantido (--SkipCleanup): $dumpFile"
}

# ============================================================
# RESUMO FINAL
# ============================================================

Write-Host ""
Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor $(if ($validationOk) { "Green" } else { "Yellow" })
if ($validationOk) {
    Write-Host "   ✅ SYNC CONCLUÍDO COM SUCESSO" -ForegroundColor Green
} else {
    Write-Host "   ⚠  SYNC CONCLUÍDO COM AVISOS — verifique os logs acima" -ForegroundColor Yellow
}
Write-Host "   Origem : nr-bps_db (localhost)" -ForegroundColor Gray
Write-Host "   Destino: neondb_staging ($stagingDisplay)" -ForegroundColor Gray
if (-not $SkipBackup -and (Test-Path $backupFile)) {
    Write-Host "   Backup : backups\staging-pre-sync-$timestamp-schema-only.sql" -ForegroundColor Gray
}
Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor $(if ($validationOk) { "Green" } else { "Yellow" })
Write-Host ""
