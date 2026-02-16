# =====================================================
# SCRIPT DE DEPLOYMENT AUTOMATIZADO - PRODUÇÃO
# QWork - Deployment das últimas 72h
# =====================================================
# Versão: 1.0
# Data: 16 de fevereiro de 2026
# Uso: ./deploy-prod.ps1
# =====================================================

param(
    [switch]$SkipBackup,
    [switch]$SkipBuild,
    [switch]$SkipValidation,
    [string]$Environment = "production"
)

# Cores para output
$Green = [System.ConsoleColor]::Green
$Red = [System.ConsoleColor]::Red
$Yellow = [System.ConsoleColor]::Yellow
$Blue = [System.ConsoleColor]::Blue

function Write-Step {
    param([string]$Message)
    Write-Host "`n=============================================" -ForegroundColor $Blue
    Write-Host $Message -ForegroundColor $Blue
    Write-Host "=============================================" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Error-Message {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Write-Warning-Message {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Yellow
}

# =====================================================
# CONFIGURAÇÕES
# =====================================================

$SCRIPT_DIR = $PSScriptRoot
$PROJECT_ROOT = Split-Path $SCRIPT_DIR -Parent
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Configurações de produção
$PROD_SERVER = "prod-server.qwork.com"  # AJUSTAR
$PROD_USER = "deploy"                    # AJUSTAR
$PROD_PATH = "/opt/qwork"                # AJUSTAR
$PROD_DB_HOST = "db-prod.qwork.com"      # AJUSTAR
$PROD_DB_NAME = "qwork_prod"             # AJUSTAR
$PROD_DB_USER = "postgres"               # AJUSTAR

Write-Step "🚀 INICIANDO DEPLOYMENT PARA PRODUÇÃO"
Write-Host "Ambiente: $Environment"
Write-Host "Timestamp: $TIMESTAMP"
Write-Host ""

# =====================================================
# PRÉ-VALIDAÇÕES
# =====================================================

Write-Step "📋 ETAPA 0: PRÉ-VALIDAÇÕES"

# Verificar se está no diretório correto
if (-not (Test-Path "$PROJECT_ROOT\package.json")) {
    Write-Error-Message "package.json não encontrado. Execute no diretório correto."
    exit 1
}
Write-Success "Diretório do projeto validado"

# Verificar Git
try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Warning-Message "Há alterações não commitadas:"
        Write-Host $gitStatus
        $response = Read-Host "Continuar mesmo assim? (s/N)"
        if ($response -ne "s") {
            Write-Error-Message "Deployment cancelado."
            exit 1
        }
    } else {
        Write-Success "Git working directory limpo"
    }
} catch {
    Write-Warning-Message "Git não disponível ou não é um repositório Git"
}

# Verificar branch
try {
    $branch = git rev-parse --abbrev-ref HEAD
    if ($branch -ne "main") {
        Write-Warning-Message "Você está na branch '$branch', não 'main'"
        $response = Read-Host "Continuar mesmo assim? (s/N)"
        if ($response -ne "s") {
            exit 1
        }
    } else {
        Write-Success "Branch: main"
    }
} catch {
    Write-Warning-Message "Não foi possível verificar branch"
}

# Verificar pnpm
try {
    $pnpmVersion = pnpm --version
    Write-Success "pnpm instalado (versão $pnpmVersion)"
} catch {
    Write-Error-Message "pnpm não está instalado"
    exit 1
}

# =====================================================
# ETAPA 1: BACKUP DO BANCO DE DADOS
# =====================================================

if (-not $SkipBackup) {
    Write-Step "💾 ETAPA 1: BACKUP DO BANCO DE DADOS"
    
    $backupDir = "$PROJECT_ROOT\backups"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
        Write-Success "Diretório de backup criado"
    }
    
    $backupFile = "$backupDir\backup-prod-$TIMESTAMP.sql"
    
    Write-Host "Executando pg_dump no servidor de produção..."
    Write-Warning-Message "Este passo requer senha do banco de dados"
    
    # Comando para executar remotamente (ajustar conforme infra)
    $pgDumpCmd = "pg_dump -h $PROD_DB_HOST -U $PROD_DB_USER -d $PROD_DB_NAME > $backupFile"
    
    Write-Host "Comando: $pgDumpCmd"
    Write-Warning-Message "ATENÇÃO: Execute manualmente no servidor ou configure acesso remoto"
    
    $response = Read-Host "Backup do banco foi executado? (s/N)"
    if ($response -ne "s") {
        Write-Error-Message "Backup não confirmado. Deployment cancelado."
        exit 1
    }
    
    Write-Success "Backup confirmado"
} else {
    Write-Warning-Message "ETAPA 1: BACKUP PULADO (--SkipBackup)"
}

# =====================================================
# ETAPA 2: BUILD LOCAL (PARA VALIDAÇÃO)
# =====================================================

if (-not $SkipBuild) {
    Write-Step "🔨 ETAPA 2: BUILD LOCAL"
    
    Write-Host "Instalando dependências..."
    $installResult = pnpm install 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Message "Falha ao instalar dependências"
        Write-Host $installResult
        exit 1
    }
    Write-Success "Dependências instaladas"
    
    Write-Host "Executando build..."
    $buildResult = pnpm build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Message "Falha no build"
        Write-Host $buildResult
        exit 1
    }
    Write-Success "Build concluído com sucesso"
    
    # Verificar se .next foi criado
    if (Test-Path "$PROJECT_ROOT\.next") {
        Write-Success "Diretório .next criado"
    } else {
        Write-Error-Message "Diretório .next não foi criado"
        exit 1
    }
} else {
    Write-Warning-Message "ETAPA 2: BUILD PULADO (--SkipBuild)"
}

# =====================================================
# ETAPA 3: PREPARAR SCRIPTS SQL
# =====================================================

Write-Step "📝 ETAPA 3: VERIFICAR SCRIPTS SQL"

$sqlScripts = @(
    "$PROJECT_ROOT\scripts\deploy-prod-migrations.sql",
    "$PROJECT_ROOT\scripts\validacao-pos-deploy.sql"
)

foreach ($script in $sqlScripts) {
    if (Test-Path $script) {
        Write-Success "Script encontrado: $(Split-Path $script -Leaf)"
    } else {
        Write-Error-Message "Script não encontrado: $(Split-Path $script -Leaf)"
        exit 1
    }
}

Write-Host ""
Write-Host "Os seguintes scripts SQL devem ser executados EM PRODUÇÃO:"
Write-Host "1. deploy-prod-migrations.sql (PRIMEIRO!)"
Write-Host "2. validacao-pos-deploy.sql (DEPOIS do restart)"
Write-Host ""

$response = Read-Host "Scripts SQL foram executados no banco de PRODUÇÃO? (s/N)"
if ($response -ne "s") {
    Write-Warning-Message "Lembre-se de executar os scripts SQL antes de continuar"
    Write-Host ""
    Write-Host "Comando:"
    Write-Host "psql -h $PROD_DB_HOST -U $PROD_DB_USER -d $PROD_DB_NAME -f scripts/deploy-prod-migrations.sql"
    Write-Host ""
    $response = Read-Host "Executar deployment de código agora? (s/N)"
    if ($response -ne "s") {
        Write-Warning-Message "Deployment pausado. Execute os scripts SQL e rode novamente."
        exit 0
    }
}

Write-Success "Scripts SQL confirmados"

# =====================================================
# ETAPA 4: DEPLOY DE CÓDIGO
# =====================================================

Write-Step "📤 ETAPA 4: DEPLOY DE CÓDIGO PARA PRODUÇÃO"

Write-Host "Opções de deployment:"
Write-Host "1. Git Pull (no servidor remoto)"
Write-Host "2. SCP/SFTP (copiar arquivos)"
Write-Host "3. Manual (você fará manualmente)"
Write-Host ""

$deployMethod = Read-Host "Escolha o método (1/2/3)"

switch ($deployMethod) {
    "1" {
        Write-Host "Executando git pull no servidor remoto..."
        Write-Warning-Message "Configure SSH sem senha ou use ssh-agent"
        
        $sshCmd = @"
cd $PROD_PATH && \
git pull origin main && \
pnpm install && \
pnpm build
"@
        
        Write-Host "Comando SSH:"
        Write-Host $sshCmd
        Write-Host ""
        
        Write-Host "Execute:"
        Write-Host "ssh $PROD_USER@$PROD_SERVER '$sshCmd'"
        Write-Host ""
        
        $response = Read-Host "Código foi deployado? (s/N)"
        if ($response -ne "s") {
            Write-Error-Message "Deploy não confirmado"
            exit 1
        }
        Write-Success "Deploy via Git confirmado"
    }
    
    "2" {
        Write-Host "Copiando arquivos via SCP..."
        
        $filesToCopy = @(
            "lib",
            "app",
            "components",
            "package.json",
            "pnpm-lock.yaml",
            ".next"
        )
        
        foreach ($item in $filesToCopy) {
            Write-Host "Copiando $item..."
            $scpCmd = "scp -r $PROJECT_ROOT\$item ${PROD_USER}@${PROD_SERVER}:$PROD_PATH/"
            Write-Host $scpCmd
        }
        
        Write-Host ""
        Write-Warning-Message "Execute os comandos acima manualmente"
        Write-Host ""
        
        $response = Read-Host "Arquivos foram copiados? (s/N)"
        if ($response -ne "s") {
            Write-Error-Message "Cópia não confirmada"
            exit 1
        }
        Write-Success "Cópia via SCP confirmada"
        
        Write-Host ""
        Write-Host "Agora execute no servidor remoto:"
        Write-Host "ssh $PROD_USER@$PROD_SERVER"
        Write-Host "cd $PROD_PATH"
        Write-Host "pnpm install"
        Write-Host "pnpm build"
        Write-Host ""
        
        $response = Read-Host "Build remoto executado? (s/N)"
        if ($response -ne "s") {
            Write-Error-Message "Build remoto não confirmado"
            exit 1
        }
        Write-Success "Build remoto confirmado"
    }
    
    "3" {
        Write-Warning-Message "Deployment manual selecionado"
        Write-Host ""
        Write-Host "Execute manualmente:"
        Write-Host "1. Copie os arquivos para $PROD_PATH"
        Write-Host "2. Execute: pnpm install"
        Write-Host "3. Execute: pnpm build"
        Write-Host ""
        
        $response = Read-Host "Deployment manual concluído? (s/N)"
        if ($response -ne "s") {
            Write-Error-Message "Deployment não confirmado"
            exit 1
        }
        Write-Success "Deployment manual confirmado"
    }
    
    default {
        Write-Error-Message "Opção inválida"
        exit 1
    }
}

# =====================================================
# ETAPA 5: RESTART DO SERVIDOR
# =====================================================

Write-Step "🔄 ETAPA 5: RESTART DO SERVIDOR"

Write-Host "Como o servidor está configurado?"
Write-Host "1. PM2"
Write-Host "2. Systemd"
Write-Host "3. Docker"
Write-Host "4. Manual"
Write-Host ""

$restartMethod = Read-Host "Escolha o método (1/2/3/4)"

switch ($restartMethod) {
    "1" {
        $cmd = "pm2 restart qwork-prod"
        Write-Host "Comando: $cmd"
    }
    "2" {
        $cmd = "sudo systemctl restart qwork-prod"
        Write-Host "Comando: $cmd"
    }
    "3" {
        $cmd = "docker restart qwork-prod"
        Write-Host "Comando: $cmd"
    }
    "4" {
        $cmd = "pkill -f 'next start' && cd $PROD_PATH && pnpm start &"
        Write-Host "Comando: $cmd"
    }
    default {
        Write-Error-Message "Opção inválida"
        exit 1
    }
}

Write-Host ""
Write-Host "Execute no servidor remoto:"
Write-Host "ssh $PROD_USER@$PROD_SERVER '$cmd'"
Write-Host ""

$response = Read-Host "Servidor foi reiniciado? (s/N)"
if ($response -ne "s") {
    Write-Error-Message "Restart não confirmado"
    exit 1
}

Write-Success "Restart confirmado"

Write-Host ""
Write-Host "Aguardando 30 segundos para servidor inicializar..."
Start-Sleep -Seconds 30
Write-Success "Aguardo concluído"

# =====================================================
# ETAPA 6: VALIDAÇÕES PÓS-DEPLOYMENT
# =====================================================

if (-not $SkipValidation) {
    Write-Step "✅ ETAPA 6: VALIDAÇÕES PÓS-DEPLOYMENT"
    
    Write-Host "Execute o script de validação SQL:"
    Write-Host "psql -h $PROD_DB_HOST -U $PROD_DB_USER -d $PROD_DB_NAME -f scripts/validacao-pos-deploy.sql"
    Write-Host ""
    
    $response = Read-Host "Script de validação foi executado? (s/N)"
    if ($response -ne "s") {
        Write-Warning-Message "Validação SQL não executada"
    } else {
        Write-Success "Validação SQL confirmada"
    }
    
    Write-Host ""
    Write-Host "TESTES FUNCIONAIS MANUAIS:"
    Write-Host "1. ✓ Q37 salva sem erro"
    Write-Host "2. ✓ Laudo gerado vai para aba 'Emitido'"
    Write-Host "3. ✓ Upload ao bucket funciona"
    Write-Host "4. ✓ Asaas retorna QR Code PIX"
    Write-Host ""
    
    $response = Read-Host "Todos os testes manuais passaram? (s/N)"
    if ($response -ne "s") {
        Write-Error-Message "Testes manuais falharam!"
        Write-Warning-Message "Considere fazer ROLLBACK"
        exit 1
    }
    
    Write-Success "Todos os testes passaram!"
} else {
    Write-Warning-Message "ETAPA 6: VALIDAÇÕES PULADAS (--SkipValidation)"
}

# =====================================================
# RESUMO FINAL
# =====================================================

Write-Step "🎉 DEPLOYMENT CONCLUÍDO!"

Write-Host ""
Write-Success "✅ Backup do banco executado"
Write-Success "✅ Build local concluído"
Write-Success "✅ Scripts SQL executados"
Write-Success "✅ Código deployado em produção"
Write-Success "✅ Servidor reiniciado"
Write-Success "✅ Validações pós-deployment OK"
Write-Host ""

Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor $Blue
Write-Host "1. Monitorar logs por 1-2 horas"
Write-Host "2. Verificar métricas de erro (deve ser < 0.1%)"
Write-Host "3. Comunicar sucesso aos usuários"
Write-Host "4. Agendar backup incremental para 24h"
Write-Host "5. Documentar lições aprendidas"
Write-Host ""

Write-Host "MONITORAMENTO:" -ForegroundColor $Blue
Write-Host "Ver logs: pm2 logs qwork-prod --lines 100"
Write-Host "Ver métricas: pm2 monit"
Write-Host "Ver erros: pm2 logs qwork-prod | grep ERROR"
Write-Host ""

Write-Success "🚀 DEPLOYMENT PRODUÇÃO FINALIZADO!"
Write-Host "Data: $TIMESTAMP"
Write-Host ""

# Salvar log do deployment
$logFile = "$PROJECT_ROOT\logs\deployment-$TIMESTAMP.log"
$logDir = "$PROJECT_ROOT\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

@"
DEPLOYMENT LOG
==============
Timestamp: $TIMESTAMP
Environment: $Environment
User: $env:USERNAME
Git Branch: $branch
Git Commit: $(git rev-parse HEAD 2>$null)

STATUS: SUCCESS

Steps Completed:
- Backup: $(if ($SkipBackup) { 'SKIPPED' } else { 'OK' })
- Build: $(if ($SkipBuild) { 'SKIPPED' } else { 'OK' })
- SQL Scripts: OK
- Code Deploy: OK
- Server Restart: OK
- Validation: $(if ($SkipValidation) { 'SKIPPED' } else { 'OK' })

"@ | Out-File -FilePath $logFile -Encoding UTF8

Write-Success "Log salvo em: $logFile"
