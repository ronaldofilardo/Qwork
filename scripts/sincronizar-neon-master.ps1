# ====================================================================
# SINCRONIZAÇÃO COMPLETA: DEV → NEON (PRODUÇÃO)
# Data: 2026-02-06
# ====================================================================
# Este script orquestra todo o processo de sincronização:
# 1. Backup do Neon
# 2. Análise de diferenças
# 3. Aplicação de migrações
# 4. Validação final

param(
    [switch]$SkipBackup,
    [switch]$SkipConfirmation,
    [switch]$DryRun
)

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║   SINCRONIZAÇÃO COMPLETA: DEV → NEON (PRODUÇÃO)           ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║   ⚠️  ATENÇÃO: Este processo modifica o banco de PRODUÇÃO ║" -ForegroundColor Yellow
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configurações
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$LOG_FILE = ".\logs\sync_neon_$TIMESTAMP.log"

# Criar diretório de logs se não existir
if (-not (Test-Path ".\logs")) {
    New-Item -ItemType Directory -Path ".\logs" -Force | Out-Null
}

# Função para log
function Write-Log {
    param([string]$message, [string]$color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $message"
    Write-Host $logMessage -ForegroundColor $color
    $logMessage | Out-File -FilePath $LOG_FILE -Append -Encoding UTF8
}

Write-Log "=========================================" "Cyan"
Write-Log "INICIANDO SINCRONIZAÇÃO COMPLETA" "Cyan"
Write-Log "=========================================" "Cyan"
Write-Log ""
Write-Log "Timestamp: $TIMESTAMP" "Gray"
Write-Log "Log file: $LOG_FILE" "Gray"

if ($DryRun) {
    Write-Log "🔍 MODO DRY RUN: Nenhuma modificação será feita" "Yellow"
}

Write-Log ""

# ====================================================================
# ETAPA 1: CONFIRMAÇÃO
# ====================================================================

if (-not $SkipConfirmation -and -not $DryRun) {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║                      ⚠️  ATENÇÃO ⚠️                        ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "Este script irá:" -ForegroundColor Yellow
    Write-Host "  1. Fazer backup completo do banco Neon (produção)" -ForegroundColor White
    Write-Host "  2. Aplicar TODAS as migrações do diretório database/migrations/" -ForegroundColor White
    Write-Host "  3. Modificar estrutura de tabelas, triggers, funções, etc." -ForegroundColor White
    Write-Host "  4. Potencialmente causar downtime se não for em horário adequado" -ForegroundColor White
    Write-Host ""
    Write-Host "Você confirma que:" -ForegroundColor Yellow
    Write-Host "  ✓ Está executando em horário de baixo tráfego" -ForegroundColor White
    Write-Host "  ✓ Notificou a equipe sobre a manutenção" -ForegroundColor White
    Write-Host "  ✓ Tem acesso ao backup em caso de problemas" -ForegroundColor White
    Write-Host "  ✓ Testou as migrações em ambiente de staging" -ForegroundColor White
    Write-Host ""
    Write-Host "Digite 'CONFIRMO' para prosseguir: " -NoNewline -ForegroundColor Red
    $confirmation = Read-Host
    
    if ($confirmation -ne "CONFIRMO") {
        Write-Log "❌ Operação cancelada pelo usuário" "Red"
        exit 0
    }
    
    Write-Log ""
    Write-Log "✓ Confirmação recebida. Prosseguindo..." "Green"
    Write-Log ""
}

# ====================================================================
# ETAPA 2: BACKUP DO NEON
# ====================================================================

if (-not $SkipBackup -and -not $DryRun) {
    Write-Log "=========================================" "Cyan"
    Write-Log "ETAPA 1/5: BACKUP DO BANCO NEON" "Cyan"
    Write-Log "=========================================" "Cyan"
    Write-Log ""
    
    try {
        & .\scripts\backup-neon.ps1
        
        if ($LASTEXITCODE -ne 0) {
            throw "Backup falhou"
        }
        
        Write-Log "✅ Backup concluído com sucesso" "Green"
        Write-Log ""
        
    } catch {
        Write-Log "❌ ERRO NO BACKUP!" "Red"
        Write-Log "   Não é seguro prosseguir sem backup" "Red"
        Write-Log "   Erro: $($_.Exception.Message)" "Red"
        exit 1
    }
    
    Start-Sleep -Seconds 2
}

# ====================================================================
# ETAPA 3: ANÁLISE DE DIFERENÇAS
# ====================================================================

Write-Log "=========================================" "Cyan"
Write-Log "ETAPA 2/5: ANÁLISE DE DIFERENÇAS" "Cyan"
Write-Log "=========================================" "Cyan"
Write-Log ""

try {
    & .\scripts\sincronizar-neon-completo.ps1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "⚠️  Análise concluída com warnings" "Yellow"
    } else {
        Write-Log "✅ Análise concluída" "Green"
    }
    
} catch {
    Write-Log "❌ ERRO NA ANÁLISE!" "Red"
    Write-Log "   Erro: $($_.Exception.Message)" "Red"
    exit 1
}

Write-Log ""
Start-Sleep -Seconds 2

# ====================================================================
# ETAPA 4: APLICAÇÃO DAS MIGRAÇÕES
# ====================================================================

if (-not $DryRun) {
    Write-Log "=========================================" "Cyan"
    Write-Log "ETAPA 3/5: APLICAÇÃO DE MIGRAÇÕES" "Cyan"
    Write-Log "=========================================" "Cyan"
    Write-Log ""
    
    try {
        & .\scripts\aplicar-todas-migracoes-neon.ps1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "⚠️  Algumas migrações falharam ou foram ignoradas" "Yellow"
            Write-Log "   Revise o log para mais detalhes" "Yellow"
        } else {
            Write-Log "✅ Migrações aplicadas com sucesso" "Green"
        }
        
    } catch {
        Write-Log "❌ ERRO NA APLICAÇÃO DAS MIGRAÇÕES!" "Red"
        Write-Log "   Erro: $($_.Exception.Message)" "Red"
        Write-Log "   Você pode tentar restaurar o backup se necessário" "Yellow"
        exit 1
    }
    
    Write-Log ""
    Start-Sleep -Seconds 2
} else {
    Write-Log "🔍 DRY RUN: Pulando aplicação de migrações" "Yellow"
    Write-Log ""
}

# ====================================================================
# ETAPA 5: VALIDAÇÃO FINAL
# ====================================================================

if (-not $DryRun) {
    Write-Log "=========================================" "Cyan"
    Write-Log "ETAPA 4/5: VALIDAÇÃO FINAL" "Cyan"
    Write-Log "=========================================" "Cyan"
    Write-Log ""
    
    $NEON_HOST = "ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech"
    $NEON_USER = "neondb_owner"
    $NEON_PASSWORD = "npg_J2QYqn5oxCzp"
    $NEON_DB = "neondb"
    $NEON_CONNECTION = "postgresql://${NEON_USER}:${NEON_PASSWORD}@${NEON_HOST}/${NEON_DB}?sslmode=require"
    
    $env:PGPASSWORD = $NEON_PASSWORD
    
    try {
        # Validar tabelas críticas
        Write-Log "Validando tabelas críticas..." "Yellow"
        
        $criticalTables = @(
            "usuarios",
            "contratantes",
            "clinicas",
            "funcionarios",
            "entidades_senhas",
            "clinicas_senhas",
            "funcionarios_entidades",
            "funcionarios_clinicas",
            "lotes_avaliacao",
            "avaliacoes",
            "laudos",
            "fila_emissao"
        )
        
        $missingTables = @()
        
        foreach ($table in $criticalTables) {
            $query = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '$table');"
            $result = & psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -t -c $query 2>&1
            
            if ($result -match "t") {
                Write-Log "   ✓ $table" "Green"
            } else {
                Write-Log "   ✗ $table (FALTANDO)" "Red"
                $missingTables += $table
            }
        }
        
        Write-Log ""
        
        if ($missingTables.Count -eq 0) {
            Write-Log "✅ Todas as tabelas críticas estão presentes" "Green"
        } else {
            Write-Log "⚠️  ATENÇÃO: $($missingTables.Count) tabelas críticas faltando:" "Red"
            $missingTables | ForEach-Object { Write-Log "   • $_" "Red" }
        }
        
        Write-Log ""
        
        # Contar total de objetos
        Write-Log "Contando objetos do banco..." "Yellow"
        
        $countQuery = @"
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public') as functions,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as triggers,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') as views;
"@
        
        $counts = & psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -t -c $countQuery 2>&1
        
        Write-Log "   Resultado: $counts" "Gray"
        Write-Log ""
        
    } catch {
        Write-Log "⚠️  Erro na validação: $($_.Exception.Message)" "Yellow"
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# ====================================================================
# ETAPA 6: RELATÓRIO FINAL
# ====================================================================

Write-Log "=========================================" "Cyan"
Write-Log "ETAPA 5/5: RELATÓRIO FINAL" "Cyan"
Write-Log "=========================================" "Cyan"
Write-Log ""

if (-not $DryRun) {
    Write-Log "✅ SINCRONIZAÇÃO CONCLUÍDA!" "Green"
    Write-Log ""
    Write-Log "📋 Resumo:" "White"
    Write-Log "   • Backup criado em: .\backups\neon\" "Gray"
    Write-Log "   • Migrações aplicadas do diretório: .\database\migrations\" "Gray"
    Write-Log "   • Validação executada" "Gray"
    Write-Log ""
    Write-Log "📄 Logs salvos em:" "White"
    Write-Log "   • Log principal: $LOG_FILE" "Gray"
    Write-Log "   • Log de migrações: .\tmp\migration_neon_log_*.txt" "Gray"
    Write-Log ""
    Write-Log "🚀 PRÓXIMOS PASSOS:" "Yellow"
    Write-Log "   1. Fazer deploy do código atualizado" "White"
    Write-Log "   2. Executar testes de integração" "White"
    Write-Log "   3. Monitorar logs de erro" "White"
    Write-Log "   4. Validar funcionamento dos endpoints" "White"
    Write-Log ""
} else {
    Write-Log "🔍 DRY RUN CONCLUÍDO" "Yellow"
    Write-Log "   Nenhuma modificação foi feita no banco" "Gray"
    Write-Log "   Revise os logs e execute sem --DryRun quando estiver pronto" "Gray"
    Write-Log ""
}

Write-Log "=========================================" "Cyan"
Write-Log "FIM DO PROCESSO" "Cyan"
Write-Log "=========================================" "Cyan"
Write-Log ""
