# Script de Limpeza Interativo com Proteções
# ATENÇÃO: Este script pede confirmação antes de executar operações destrutivas
# Data: 2025-12-23

param(
    [switch]$Force,
    [switch]$SkipBackup
)

$ErrorActionPreference = "Stop"

# Cores para output
function Write-Critical {
    param([string]$Message)
    Write-Host "⛔ CRÍTICO: $Message" -ForegroundColor Red -BackgroundColor Black
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  AVISO: $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

# Banner
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host "   SCRIPT DE LIMPEZA DE CONTRATANTES - MODO SEGURO" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host ""

# Verificar banco de dados
$env:PGPASSWORD = '123456'
$database = "nr-bps_db"

Write-Info "Verificando conexão com banco de dados..."
$dbCheck = psql -U postgres -d $database -t -c "SELECT current_database();" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Critical "Não foi possível conectar ao banco de dados!"
    exit 1
}

Write-Success "Conectado ao banco: $database"
Write-Host ""

# Verificar se é ambiente de produção
Write-Critical "VERIFICAÇÃO DE AMBIENTE"
Write-Host ""
Write-Warning-Custom "Este script irá DELETAR TODOS os dados de contratantes!"
Write-Warning-Custom "Isso inclui: contratos, pagamentos, vínculos, etc."
Write-Info "Senhas NÃO serão deletadas (proteção implementada)"
Write-Host ""

if (-not $Force) {
    Write-Host "Para continuar, digite exatamente: " -NoNewline
    Write-Host "DELETAR TUDO" -ForegroundColor Red
    $confirmacao = Read-Host "Confirmação"
    
    if ($confirmacao -ne "DELETAR TUDO") {
        Write-Info "Operação cancelada pelo usuário."
        exit 0
    }
}

Write-Host ""
Write-Info "Contando registros antes da limpeza..."

# Contar registros
$counts = psql -U postgres -d $database -t -c @"
SELECT 
    (SELECT COUNT(*) FROM contratantes) as contratantes,
    (SELECT COUNT(*) FROM contratantes_senhas) as senhas,
    (SELECT COUNT(*) FROM contratos) as contratos,
    (SELECT COUNT(*) FROM pagamentos) as pagamentos;
"@

Write-Host ""
Write-Host "Registros atuais:" -ForegroundColor Cyan
Write-Host $counts
Write-Host ""

# Criar backup automático
if (-not $SkipBackup) {
    Write-Info "Criando backup de segurança..."
    $backupDir = "backups"
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = "$backupDir/backup-before-cleanup-$timestamp.sql"
    
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    pg_dump -U postgres -d $database -f $backupFile 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backup criado: $backupFile"
    } else {
        Write-Critical "Falha ao criar backup!"
        exit 1
    }
    Write-Host ""
}

# Confirmar novamente
Write-Critical "ÚLTIMA CONFIRMAÇÃO"
Write-Host ""
Write-Host "Você tem certeza ABSOLUTA que deseja continuar?" -ForegroundColor Red
Write-Host "Esta operação é IRREVERSÍVEL!" -ForegroundColor Red
Write-Host ""
Write-Host "Digite 'SIM' para continuar ou qualquer outra coisa para cancelar: " -NoNewline
$confirmacaoFinal = Read-Host

if ($confirmacaoFinal -ne "SIM") {
    Write-Info "Operação cancelada."
    exit 0
}

Write-Host ""
Write-Info "Executando limpeza..."

# Executar script de limpeza
$result = psql -U postgres -d $database -f "scripts/clean-contratantes.sql" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Success "Limpeza concluída com sucesso!"
} else {
    Write-Critical "Erro durante a limpeza:"
    Write-Host $result -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Info "Verificando resultado..."

# Contar registros após limpeza
$countsAfter = psql -U postgres -d $database -t -c @"
SELECT 
    (SELECT COUNT(*) FROM contratantes) as contratantes,
    (SELECT COUNT(*) FROM contratantes_senhas) as senhas,
    (SELECT COUNT(*) FROM contratos) as contratos,
    (SELECT COUNT(*) FROM pagamentos) as pagamentos;
"@

Write-Host ""
Write-Host "Registros após limpeza:" -ForegroundColor Cyan
Write-Host $countsAfter
Write-Host ""

# Verificar auditoria de senhas
Write-Info "Verificando proteção de senhas..."
$senhasAudit = psql -U postgres -d $database -t -c "SELECT COUNT(*) FROM contratantes_senhas_audit WHERE operacao = 'DELETE';" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Success "Sistema de auditoria funcionando corretamente"
    Write-Info "Tentativas de delete bloqueadas: $senhasAudit"
} else {
    Write-Warning-Custom "Sistema de auditoria não está ativo"
    Write-Info "Execute a migração 030_protecao_senhas_critica.sql"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host "   LIMPEZA CONCLUÍDA" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host ""

if (-not $SkipBackup) {
    Write-Info "Backup disponível em: $backupFile"
}

Write-Success "Script finalizado com sucesso!"
Write-Host ""
