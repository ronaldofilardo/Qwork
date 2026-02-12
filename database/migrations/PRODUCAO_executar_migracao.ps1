#!/usr/bin/env pwsh
# ============================================================================
# SCRIPT DE EXECUÇÃO AUTOMATIZADA DA MIGRAÇÃO
# ============================================================================
# Objetivo: Executar a migração em produção de forma segura e automatizada
# Uso: .\PRODUCAO_executar_migracao.ps1
# ============================================================================

param(
    [switch]$SkipBackup,
    [switch]$SkipVerification,
    [switch]$DryRun
)

# Configurações
$DB_URL = "postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$MIGRATION_FILE = "database/migrations/PRODUCAO_sync_confirmacao_identidade.sql"
$VERIFICATION_FILE = "database/migrations/PRODUCAO_verificacao.sql"
$BACKUP_DIR = "database/backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

# Cores para output
$COLOR_SUCCESS = "Green"
$COLOR_ERROR = "Red"
$COLOR_WARNING = "Yellow"
$COLOR_INFO = "Cyan"

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

function Write-Step {
    param([string]$Message)
    Write-Host "`n$($Message)" -ForegroundColor $COLOR_INFO
    Write-Host ("=" * 70) -ForegroundColor $COLOR_INFO
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $COLOR_SUCCESS
}

function Write-Error-Message {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $COLOR_ERROR
}

function Write-Warning-Message {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $COLOR_WARNING
}

function Test-PostgreSQL {
    try {
        $result = psql --version
        return $true
    } catch {
        return $false
    }
}

function Execute-SQL {
    param(
        [string]$Query,
        [string]$File,
        [switch]$Silent
    )
    
    try {
        if ($File) {
            if ($Silent) {
                psql $DB_URL -f $File -v ON_ERROR_STOP=1 2>&1 | Out-Null
            } else {
                psql $DB_URL -f $File -v ON_ERROR_STOP=1
            }
        } else {
            if ($Silent) {
                $result = psql $DB_URL -c $Query -t -A 2>&1
            } else {
                $result = psql $DB_URL -c $Query
            }
            return $result
        }
        return $true
    } catch {
        Write-Error-Message "Erro ao executar SQL: $($_.Exception.Message)"
        return $false
    }
}

# ============================================================================
# INÍCIO DO SCRIPT
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $COLOR_INFO
Write-Host "║  MIGRAÇÃO DE PRODUÇÃO - confirmacao_identidade                 ║" -ForegroundColor $COLOR_INFO
Write-Host "║  Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')                              ║" -ForegroundColor $COLOR_INFO
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor $COLOR_INFO

if ($DryRun) {
    Write-Warning-Message "MODO DRY RUN - Nenhuma alteração será feita"
}

# ============================================================================
# PRÉ-REQUISITOS
# ============================================================================

Write-Step "1. VERIFICANDO PRÉ-REQUISITOS"

# Verificar psql
if (-not (Test-PostgreSQL)) {
    Write-Error-Message "PostgreSQL client (psql) não encontrado!"
    Write-Host "  Instale o PostgreSQL: https://www.postgresql.org/download/"
    exit 1
}
Write-Success "PostgreSQL client instalado"

# Verificar arquivos
if (-not (Test-Path $MIGRATION_FILE)) {
    Write-Error-Message "Arquivo de migração não encontrado: $MIGRATION_FILE"
    exit 1
}
Write-Success "Arquivo de migração encontrado"

if (-not (Test-Path $VERIFICATION_FILE)) {
    Write-Warning-Message "Arquivo de verificação não encontrado: $VERIFICATION_FILE"
}

# ============================================================================
# VERIFICAÇÃO PRÉ-MIGRAÇÃO
# ============================================================================

if (-not $SkipVerification) {
    Write-Step "2. VERIFICAÇÃO PRÉ-MIGRAÇÃO"
    
    Write-Host "`nExecutando verificação do estado atual do banco..."
    Execute-SQL -File $VERIFICATION_FILE
    
    Write-Host "`n"
    $continue = Read-Host "Deseja continuar com a migração? (s/N)"
    if ($continue -ne 's' -and $continue -ne 'S') {
        Write-Warning-Message "Migração cancelada pelo usuário"
        exit 0
    }
} else {
    Write-Step "2. VERIFICAÇÃO PRÉ-MIGRAÇÃO (PULADA)"
}

# ============================================================================
# BACKUP
# ============================================================================

if (-not $SkipBackup -and -not $DryRun) {
    Write-Step "3. CRIANDO BACKUP"
    
    # Criar diretório de backup
    if (-not (Test-Path $BACKUP_DIR)) {
        New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    }
    
    $backupFile = "$BACKUP_DIR/backup_pre_migration_$TIMESTAMP.sql"
    
    Write-Host "Fazendo backup do schema..."
    
    $env:PGPASSWORD = "REDACTED_NEON_PASSWORD"
    pg_dump `
        -h ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech `
        -U neondb_owner `
        -d neondb `
        --schema-only `
        -t avaliacoes `
        -t funcionarios `
        -f $backupFile
    
    if (Test-Path $backupFile) {
        Write-Success "Backup criado: $backupFile"
    } else {
        Write-Error-Message "Falha ao criar backup!"
        $continue = Read-Host "Continuar sem backup? (s/N)"
        if ($continue -ne 's' -and $continue -ne 'S') {
            exit 1
        }
    }
} else {
    Write-Step "3. BACKUP (PULADO)"
    if ($DryRun) {
        Write-Warning-Message "Dry run - backup não necessário"
    } else {
        Write-Warning-Message "Backup pulado por parâmetro -SkipBackup"
    }
}

# ============================================================================
# VERIFICAÇÃO FINAL ANTES DA MIGRAÇÃO
# ============================================================================

Write-Step "4. VERIFICAÇÃO FINAL"

Write-Host "Verificando se a tabela já existe..."
$tableExists = Execute-SQL -Query "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'confirmacao_identidade');" -Silent

if ($tableExists -match 't|true') {
    Write-Error-Message "A tabela confirmacao_identidade JÁ EXISTE!"
    Write-Host "  Execute o rollback primeiro se deseja recriar a tabela."
    exit 1
}
Write-Success "Tabela não existe - pronto para migração"

# ============================================================================
# EXECUÇÃO DA MIGRAÇÃO
# ============================================================================

if ($DryRun) {
    Write-Step "5. EXECUÇÃO DA MIGRAÇÃO (DRY RUN)"
    Write-Warning-Message "Modo Dry Run - A migração NÃO será executada"
    Write-Host "`nConteúdo que seria executado:"
    Write-Host "  Arquivo: $MIGRATION_FILE"
    Get-Content $MIGRATION_FILE | Select-Object -First 20
    Write-Host "  ..."
} else {
    Write-Step "5. EXECUTANDO MIGRAÇÃO"
    
    Write-Host "`nExecutando: $MIGRATION_FILE"
    Write-Host "Isso pode levar alguns segundos..."
    
    $migrationResult = Execute-SQL -File $MIGRATION_FILE
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Migração executada com sucesso!"
    } else {
        Write-Error-Message "Falha na migração!"
        Write-Host "`nVerifique os logs acima para detalhes do erro."
        Write-Host "O banco deve estar no estado original (transação revertida)."
        exit 1
    }
}

# ============================================================================
# VERIFICAÇÃO PÓS-MIGRAÇÃO
# ============================================================================

if (-not $DryRun) {
    Write-Step "6. VERIFICAÇÃO PÓS-MIGRAÇÃO"
    
    Write-Host "`nVerificando estado final do banco..."
    Execute-SQL -File $VERIFICATION_FILE
    
    # Verificações específicas
    Write-Host "`nVerificações adicionais:"
    
    $tableExists = Execute-SQL -Query "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'confirmacao_identidade');" -Silent
    if ($tableExists -match 't|true') {
        Write-Success "Tabela confirmacao_identidade criada"
    } else {
        Write-Error-Message "Tabela não foi criada!"
    }
    
    $rlsEnabled = Execute-SQL -Query "SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'confirmacao_identidade';" -Silent
    if ($rlsEnabled -match 't|true') {
        Write-Success "RLS habilitado"
    } else {
        Write-Warning-Message "RLS não está habilitado!"
    }
    
    $policyCount = Execute-SQL -Query "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'confirmacao_identidade';" -Silent
    $policyCount = $policyCount.Trim()
    if ($policyCount -eq '5') {
        Write-Success "5 políticas RLS criadas"
    } else {
        Write-Warning-Message "Esperadas 5 políticas, encontradas: $policyCount"
    }
    
    $indexCount = Execute-SQL -Query "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'confirmacao_identidade';" -Silent
    $indexCount = $indexCount.Trim()
    if ($indexCount -eq '4') {
        Write-Success "4 índices criados"
    } else {
        Write-Warning-Message "Esperados 4 índices, encontrados: $indexCount"
    }
}

# ============================================================================
# RESUMO FINAL
# ============================================================================

Write-Host "`n"
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $COLOR_SUCCESS
Write-Host "║  MIGRAÇÃO CONCLUÍDA COM SUCESSO!                               ║" -ForegroundColor $COLOR_SUCCESS
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor $COLOR_SUCCESS

Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor $COLOR_INFO
Write-Host "  1. Revisar os resultados da verificação acima"
Write-Host "  2. Fazer deploy do código da aplicação"
Write-Host "  3. Testar a funcionalidade de confirmação de identidade"
Write-Host "  4. Monitorar logs da aplicação"

Write-Host "`n📁 ARQUIVOS:" -ForegroundColor $COLOR_INFO
if (Test-Path "$BACKUP_DIR/backup_pre_migration_$TIMESTAMP.sql") {
    Write-Host "  Backup: $BACKUP_DIR/backup_pre_migration_$TIMESTAMP.sql"
}
Write-Host "  Migração: $MIGRATION_FILE"
Write-Host "  Verificação: $VERIFICATION_FILE"

Write-Host "`n📊 ESTATÍSTICAS:" -ForegroundColor $COLOR_INFO
Write-Host "  Data/Hora: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
Write-Host "  Banco: neondb (Produção)"
if ($DryRun) {
    Write-Host "  Modo: DRY RUN (sem alterações)" -ForegroundColor $COLOR_WARNING
} else {
    Write-Host "  Status: ✓ MIGRAÇÃO APLICADA" -ForegroundColor $COLOR_SUCCESS
}

Write-Host "`n"
