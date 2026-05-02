# ==========================================
# Script: Remover Sistema de Emissão Automática
# ==========================================
# Data: 2026-01-31
# Descrição: Remove definitivamente todas as colunas e código
#            relacionado ao sistema de emissão automática
# ==========================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'prod')]
    [string]$Environment = 'dev',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBackup
)

$ErrorActionPreference = "Stop"

# Cores para output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Banner
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  REMOÇÃO DE SISTEMA DE EMISSÃO AUTOMÁTICA                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuração do banco
$DbName = if ($Environment -eq 'prod') { 'nr-bps_db' } else { 'nr-bps_db_test' }
$DbUser = 'postgres'
$DbPassword = if ($env:LOCAL_DB_PASSWORD) { $env:LOCAL_DB_PASSWORD } else { "postgres" }

Write-Info "Ambiente: $Environment"
Write-Info "Banco de dados: $DbName"
Write-Host ""

# Confirmar ação
Write-Warning "⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!"
Write-Warning "As seguintes colunas serão PERMANENTEMENTE removidas:"
Write-Warning "  - auto_emitir_em"
Write-Warning "  - auto_emitir_agendado"
Write-Warning "  - processamento_em"
Write-Warning "  - cancelado_automaticamente"
Write-Warning "  - motivo_cancelamento"
Write-Host ""

if ($Environment -eq 'prod') {
    Write-Error "⚠️⚠️⚠️  VOCÊ ESTÁ PRESTES A MODIFICAR O BANCO DE PRODUÇÃO!  ⚠️⚠️⚠️"
    Write-Host ""
}

$confirmation = Read-Host "Digite 'REMOVER' (em maiúsculas) para continuar"
if ($confirmation -ne 'REMOVER') {
    Write-Error "Operação cancelada pelo usuário."
    exit 1
}

Write-Host ""

# Backup (se não for pulado)
if (-not $SkipBackup) {
    Write-Info "📦 Criando backup do banco de dados..."
    $BackupFile = "backup_antes_remocao_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    $BackupPath = Join-Path $PSScriptRoot "..\..\storage\backups\$BackupFile"
    
    # Criar diretório se não existir
    $BackupDir = Split-Path $BackupPath -Parent
    if (-not (Test-Path $BackupDir)) {
        New-Item -Path $BackupDir -ItemType Directory -Force | Out-Null
    }
    
    try {
        $env:PGPASSWORD = $DbPassword
        & pg_dump -U $DbUser -d $DbName > $BackupPath
        Write-Success "✅ Backup criado: $BackupPath"
    }
    catch {
        Write-Error "❌ Erro ao criar backup: $_"
        Write-Warning "Deseja continuar sem backup? (S/N)"
        $response = Read-Host
        if ($response -ne 'S') {
            exit 1
        }
    }
    Write-Host ""
} else {
    Write-Warning "⚠️  Backup foi pulado (flag -SkipBackup)"
    Write-Host ""
}

# Executar migration
Write-Info "🔧 Aplicando migration 130..."
Write-Host ""

try {
    $env:PGPASSWORD = $DbPassword
    $MigrationPath = Join-Path $PSScriptRoot "..\..\database\migrations\130_remove_auto_emission_columns.sql"
    
    if (-not (Test-Path $MigrationPath)) {
        Write-Error "❌ Migration não encontrada: $MigrationPath"
        exit 1
    }
    
    $output = & psql -U $DbUser -d $DbName -f $MigrationPath 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Erro ao executar migration:"
        Write-Error $output
        exit 1
    }
    
    Write-Host $output
    Write-Success "`n✅ Migration 130 aplicada com sucesso!"
}
catch {
    Write-Error "❌ Erro ao executar migration: $_"
    if (-not $SkipBackup) {
        Write-Warning "Para reverter, execute:"
        Write-Warning "  psql -U $DbUser -d $DbName < $BackupPath"
    }
    exit 1
}

Write-Host ""

# Validação
Write-Info "🔍 Validando remoção..."
Write-Host ""

try {
    $env:PGPASSWORD = $DbPassword
    
    # Verificar colunas
    $checkColumns = @"
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'lotes_avaliacao' 
AND column_name IN (
    'auto_emitir_em',
    'auto_emitir_agendado',
    'processamento_em',
    'cancelado_automaticamente',
    'motivo_cancelamento'
);
"@
    
    $result = & psql -U $DbUser -d $DbName -t -c $checkColumns
    
    if ($result.Trim()) {
        Write-Error "❌ FALHA: Colunas ainda existem:"
        Write-Error $result
        exit 1
    } else {
        Write-Success "✅ Todas as colunas foram removidas"
    }
    
    # Verificar triggers
    $checkTriggers = @"
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'trg_verificar_cancelamento_automatico';
"@
    
    $result = & psql -U $DbUser -d $DbName -t -c $checkTriggers
    
    if ($result.Trim()) {
        Write-Error "❌ FALHA: Trigger ainda existe:"
        Write-Error $result
        exit 1
    } else {
        Write-Success "✅ Trigger de cancelamento automático removido"
    }
    
    # Verificar funções
    $checkFunctions = @"
SELECT proname 
FROM pg_proc 
WHERE proname = 'verificar_cancelamento_automatico_lote';
"@
    
    $result = & psql -U $DbUser -d $DbName -t -c $checkFunctions
    
    if ($result.Trim()) {
        Write-Error "❌ FALHA: Função ainda existe:"
        Write-Error $result
        exit 1
    } else {
        Write-Success "✅ Função de cancelamento automático removida"
    }
}
catch {
    Write-Error "❌ Erro durante validação: $_"
    exit 1
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ REMOÇÃO CONCLUÍDA COM SUCESSO                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Success "Sistema de emissão automática COMPLETAMENTE removido."
Write-Success "Emissão de laudos é agora 100% MANUAL pelo emissor."
Write-Host ""

if (-not $SkipBackup) {
    Write-Info "📦 Backup disponível em: $BackupPath"
    Write-Host ""
}

Write-Info "📝 Próximos passos:"
Write-Info "  1. Executar testes: npm test"
Write-Info "  2. Verificar dashboard do emissor"
Write-Info "  3. Testar fluxo completo de emissão manual"
Write-Info "  4. Atualizar/remover testes legados (ver TESTES-LEGADOS-EMISSAO-AUTOMATICA.md)"
Write-Host ""
