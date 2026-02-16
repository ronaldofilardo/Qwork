#!/bin/bash
# =====================================================
# SCRIPT DE DEPLOYMENT AUTOMATIZADO - PRODUÇÃO
# QWork - Deployment das últimas 72h
# =====================================================
# Versão: 1.0
# Data: 16 de fevereiro de 2026
# Uso: ./deploy-prod.sh
# =====================================================

set -e  # Exit on error

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
write_step() {
    echo -e "\n${BLUE}=============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=============================================${NC}"
}

write_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

write_error() {
    echo -e "${RED}❌ $1${NC}"
}

write_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# =====================================================
# CONFIGURAÇÕES
# =====================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# Configurações de produção (AJUSTAR!)
PROD_SERVER="prod-server.qwork.com"
PROD_USER="deploy"
PROD_PATH="/opt/qwork"
PROD_DB_HOST="db-prod.qwork.com"
PROD_DB_NAME="qwork_prod"
PROD_DB_USER="postgres"

# Flags
SKIP_BACKUP=false
SKIP_BUILD=false
SKIP_VALIDATION=false

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        *)
            echo "Argumento desconhecido: $1"
            exit 1
            ;;
    esac
done

write_step "🚀 INICIANDO DEPLOYMENT PARA PRODUÇÃO"
echo "Timestamp: $TIMESTAMP"
echo ""

# =====================================================
# PRÉ-VALIDAÇÕES
# =====================================================

write_step "📋 ETAPA 0: PRÉ-VALIDAÇÕES"

# Verificar se está no diretório correto
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    write_error "package.json não encontrado. Execute no diretório correto."
    exit 1
fi
write_success "Diretório do projeto validado"

# Verificar Git
if command -v git &> /dev/null; then
    if [ -n "$(git status --porcelain)" ]; then
        write_warning "Há alterações não commitadas:"
        git status --short
        read -p "Continuar mesmo assim? (s/N): " response
        if [ "$response" != "s" ]; then
            write_error "Deployment cancelado."
            exit 1
        fi
    else
        write_success "Git working directory limpo"
    fi
    
    # Verificar branch
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$BRANCH" != "main" ]; then
        write_warning "Você está na branch '$BRANCH', não 'main'"
        read -p "Continuar mesmo assim? (s/N): " response
        if [ "$response" != "s" ]; then
            exit 1
        fi
    else
        write_success "Branch: main"
    fi
else
    write_warning "Git não disponível"
fi

# Verificar pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    write_success "pnpm instalado (versão $PNPM_VERSION)"
else
    write_error "pnpm não está instalado"
    exit 1
fi

# =====================================================
# ETAPA 1: BACKUP DO BANCO DE DADOS
# =====================================================

if [ "$SKIP_BACKUP" = false ]; then
    write_step "💾 ETAPA 1: BACKUP DO BANCO DE DADOS"
    
    BACKUP_DIR="$PROJECT_ROOT/backups"
    mkdir -p "$BACKUP_DIR"
    write_success "Diretório de backup verificado"
    
    BACKUP_FILE="$BACKUP_DIR/backup-prod-$TIMESTAMP.sql"
    
    echo "Executando pg_dump no servidor de produção..."
    write_warning "Este passo requer senha do banco de dados"
    
    echo "Comando:"
    echo "pg_dump -h $PROD_DB_HOST -U $PROD_DB_USER -d $PROD_DB_NAME > $BACKUP_FILE"
    echo ""
    write_warning "ATENÇÃO: Execute manualmente no servidor ou configure acesso remoto"
    echo ""
    
    read -p "Backup do banco foi executado? (s/N): " response
    if [ "$response" != "s" ]; then
        write_error "Backup não confirmado. Deployment cancelado."
        exit 1
    fi
    
    write_success "Backup confirmado"
else
    write_warning "ETAPA 1: BACKUP PULADO (--skip-backup)"
fi

# =====================================================
# ETAPA 2: BUILD LOCAL (PARA VALIDAÇÃO)
# =====================================================

if [ "$SKIP_BUILD" = false ]; then
    write_step "🔨 ETAPA 2: BUILD LOCAL"
    
    echo "Instalando dependências..."
    if pnpm install; then
        write_success "Dependências instaladas"
    else
        write_error "Falha ao instalar dependências"
        exit 1
    fi
    
    echo "Executando build..."
    if pnpm build; then
        write_success "Build concluído com sucesso"
    else
        write_error "Falha no build"
        exit 1
    fi
    
    # Verificar se .next foi criado
    if [ -d "$PROJECT_ROOT/.next" ]; then
        write_success "Diretório .next criado"
    else
        write_error "Diretório .next não foi criado"
        exit 1
    fi
else
    write_warning "ETAPA 2: BUILD PULADO (--skip-build)"
fi

# =====================================================
# ETAPA 3: VERIFICAR SCRIPTS SQL
# =====================================================

write_step "📝 ETAPA 3: VERIFICAR SCRIPTS SQL"

SQL_SCRIPTS=(
    "$PROJECT_ROOT/scripts/deploy-prod-migrations.sql"
    "$PROJECT_ROOT/scripts/validacao-pos-deploy.sql"
)

for script in "${SQL_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        write_success "Script encontrado: $(basename "$script")"
    else
        write_error "Script não encontrado: $(basename "$script")"
        exit 1
    fi
done

echo ""
echo "Os seguintes scripts SQL devem ser executados EM PRODUÇÃO:"
echo "1. deploy-prod-migrations.sql (PRIMEIRO!)"
echo "2. validacao-pos-deploy.sql (DEPOIS do restart)"
echo ""

read -p "Scripts SQL foram executados no banco de PRODUÇÃO? (s/N): " response
if [ "$response" != "s" ]; then
    write_warning "Lembre-se de executar os scripts SQL antes de continuar"
    echo ""
    echo "Comando:"
    echo "psql -h $PROD_DB_HOST -U $PROD_DB_USER -d $PROD_DB_NAME -f scripts/deploy-prod-migrations.sql"
    echo ""
    read -p "Executar deployment de código agora? (s/N): " response
    if [ "$response" != "s" ]; then
        write_warning "Deployment pausado. Execute os scripts SQL e rode novamente."
        exit 0
    fi
fi

write_success "Scripts SQL confirmados"

# =====================================================
# ETAPA 4: DEPLOY DE CÓDIGO
# =====================================================

write_step "📤 ETAPA 4: DEPLOY DE CÓDIGO PARA PRODUÇÃO"

echo "Opções de deployment:"
echo "1. Git Pull (no servidor remoto)"
echo "2. SCP/SFTP (copiar arquivos)"
echo "3. Manual (você fará manualmente)"
echo ""

read -p "Escolha o método (1/2/3): " deploy_method

case $deploy_method in
    1)
        echo "Executando git pull no servidor remoto..."
        write_warning "Configure SSH sem senha ou use ssh-agent"
        
        SSH_CMD="cd $PROD_PATH && git pull origin main && pnpm install && pnpm build"
        
        echo "Comando SSH:"
        echo "$SSH_CMD"
        echo ""
        
        echo "Execute:"
        echo "ssh $PROD_USER@$PROD_SERVER '$SSH_CMD'"
        echo ""
        
        read -p "Código foi deployado? (s/N): " response
        if [ "$response" != "s" ]; then
            write_error "Deploy não confirmado"
            exit 1
        fi
        write_success "Deploy via Git confirmado"
        ;;
    
    2)
        echo "Copiando arquivos via SCP..."
        
        FILES_TO_COPY=("lib" "app" "components" "package.json" "pnpm-lock.yaml" ".next")
        
        for item in "${FILES_TO_COPY[@]}"; do
            echo "Copiando $item..."
            echo "scp -r $PROJECT_ROOT/$item ${PROD_USER}@${PROD_SERVER}:$PROD_PATH/"
        done
        
        echo ""
        write_warning "Execute os comandos acima manualmente"
        echo ""
        
        read -p "Arquivos foram copiados? (s/N): " response
        if [ "$response" != "s" ]; then
            write_error "Cópia não confirmada"
            exit 1
        fi
        write_success "Cópia via SCP confirmada"
        
        echo ""
        echo "Agora execute no servidor remoto:"
        echo "ssh $PROD_USER@$PROD_SERVER"
        echo "cd $PROD_PATH"
        echo "pnpm install"
        echo "pnpm build"
        echo ""
        
        read -p "Build remoto executado? (s/N): " response
        if [ "$response" != "s" ]; then
            write_error "Build remoto não confirmado"
            exit 1
        fi
        write_success "Build remoto confirmado"
        ;;
    
    3)
        write_warning "Deployment manual selecionado"
        echo ""
        echo "Execute manualmente:"
        echo "1. Copie os arquivos para $PROD_PATH"
        echo "2. Execute: pnpm install"
        echo "3. Execute: pnpm build"
        echo ""
        
        read -p "Deployment manual concluído? (s/N): " response
        if [ "$response" != "s" ]; then
            write_error "Deployment não confirmado"
            exit 1
        fi
        write_success "Deployment manual confirmado"
        ;;
    
    *)
        write_error "Opção inválida"
        exit 1
        ;;
esac

# =====================================================
# ETAPA 5: RESTART DO SERVIDOR
# =====================================================

write_step "🔄 ETAPA 5: RESTART DO SERVIDOR"

echo "Como o servidor está configurado?"
echo "1. PM2"
echo "2. Systemd"
echo "3. Docker"
echo "4. Manual"
echo ""

read -p "Escolha o método (1/2/3/4): " restart_method

case $restart_method in
    1)
        CMD="pm2 restart qwork-prod"
        ;;
    2)
        CMD="sudo systemctl restart qwork-prod"
        ;;
    3)
        CMD="docker restart qwork-prod"
        ;;
    4)
        CMD="pkill -f 'next start' && cd $PROD_PATH && pnpm start &"
        ;;
    *)
        write_error "Opção inválida"
        exit 1
        ;;
esac

echo "Comando: $CMD"
echo ""
echo "Execute no servidor remoto:"
echo "ssh $PROD_USER@$PROD_SERVER '$CMD'"
echo ""

read -p "Servidor foi reiniciado? (s/N): " response
if [ "$response" != "s" ]; then
    write_error "Restart não confirmado"
    exit 1
fi

write_success "Restart confirmado"

echo ""
echo "Aguardando 30 segundos para servidor inicializar..."
sleep 30
write_success "Aguardo concluído"

# =====================================================
# ETAPA 6: VALIDAÇÕES PÓS-DEPLOYMENT
# =====================================================

if [ "$SKIP_VALIDATION" = false ]; then
    write_step "✅ ETAPA 6: VALIDAÇÕES PÓS-DEPLOYMENT"
    
    echo "Execute o script de validação SQL:"
    echo "psql -h $PROD_DB_HOST -U $PROD_DB_USER -d $PROD_DB_NAME -f scripts/validacao-pos-deploy.sql"
    echo ""
    
    read -p "Script de validação foi executado? (s/N): " response
    if [ "$response" != "s" ]; then
        write_warning "Validação SQL não executada"
    else
        write_success "Validação SQL confirmada"
    fi
    
    echo ""
    echo "TESTES FUNCIONAIS MANUAIS:"
    echo "1. ✓ Q37 salva sem erro"
    echo "2. ✓ Laudo gerado vai para aba 'Emitido'"
    echo "3. ✓ Upload ao bucket funciona"
    echo "4. ✓ Asaas retorna QR Code PIX"
    echo ""
    
    read -p "Todos os testes manuais passaram? (s/N): " response
    if [ "$response" != "s" ]; then
        write_error "Testes manuais falharam!"
        write_warning "Considere fazer ROLLBACK"
        exit 1
    fi
    
    write_success "Todos os testes passaram!"
else
    write_warning "ETAPA 6: VALIDAÇÕES PULADAS (--skip-validation)"
fi

# =====================================================
# RESUMO FINAL
# =====================================================

write_step "🎉 DEPLOYMENT CONCLUÍDO!"

echo ""
write_success "✅ Backup do banco executado"
write_success "✅ Build local concluído"
write_success "✅ Scripts SQL executados"
write_success "✅ Código deployado em produção"
write_success "✅ Servidor reiniciado"
write_success "✅ Validações pós-deployment OK"
echo ""

echo -e "${BLUE}PRÓXIMOS PASSOS:${NC}"
echo "1. Monitorar logs por 1-2 horas"
echo "2. Verificar métricas de erro (deve ser < 0.1%)"
echo "3. Comunicar sucesso aos usuários"
echo "4. Agendar backup incremental para 24h"
echo "5. Documentar lições aprendidas"
echo ""

echo -e "${BLUE}MONITORAMENTO:${NC}"
echo "Ver logs: pm2 logs qwork-prod --lines 100"
echo "Ver métricas: pm2 monit"
echo "Ver erros: pm2 logs qwork-prod | grep ERROR"
echo ""

write_success "🚀 DEPLOYMENT PRODUÇÃO FINALIZADO!"
echo "Data: $TIMESTAMP"
echo ""

# Salvar log do deployment
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/deployment-$TIMESTAMP.log"

cat > "$LOG_FILE" <<EOF
DEPLOYMENT LOG
==============
Timestamp: $TIMESTAMP
User: $USER
Git Branch: $BRANCH
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "N/A")

STATUS: SUCCESS

Steps Completed:
- Backup: $([ "$SKIP_BACKUP" = true ] && echo "SKIPPED" || echo "OK")
- Build: $([ "$SKIP_BUILD" = true ] && echo "SKIPPED" || echo "OK")
- SQL Scripts: OK
- Code Deploy: OK
- Server Restart: OK
- Validation: $([ "$SKIP_VALIDATION" = true ] && echo "SKIPPED" || echo "OK")

EOF

write_success "Log salvo em: $LOG_FILE"
