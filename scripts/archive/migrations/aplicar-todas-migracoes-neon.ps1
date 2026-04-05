# ====================================================================
# APLICAR TODAS AS MIGRAÇÕES NO BANCO NEON (PRODUÇÃO)
# Data: 2026-02-06
# ====================================================================
# Este script aplica TODAS as migrações do diretório database/migrations/
# no banco Neon em ordem sequencial

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "APLICAÇÃO DE TODAS AS MIGRAÇÕES NO NEON" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuração da conexão Neon
$NEON_HOST = "ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$NEON_PASSWORD = "npg_J2QYqn5oxCzp"
$NEON_DB = "neondb"
$NEON_CONNECTION = "postgresql://${NEON_USER}:${NEON_PASSWORD}@${NEON_HOST}/${NEON_DB}?sslmode=require&channel_binding=require"

# Diretório de migrações
$MIGRATIONS_DIR = ".\database\migrations"
$LOG_FILE = ".\tmp\migration_neon_log_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"

# Função para log
function Write-Log {
    param([string]$message, [string]$color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $message"
    Write-Host $logMessage -ForegroundColor $color
    $logMessage | Out-File -FilePath $LOG_FILE -Append -Encoding UTF8
}

# Criar diretório tmp se não existir
if (-not (Test-Path ".\tmp")) {
    New-Item -ItemType Directory -Path ".\tmp" | Out-Null
}

Write-Log "=========================================" "Cyan"
Write-Log "INICIANDO PROCESSO DE MIGRAÇÃO" "Cyan"
Write-Log "=========================================" "Cyan"
Write-Log ""
Write-Log "Banco de destino: $NEON_DB @ $NEON_HOST" "Yellow"
Write-Log "Diretório de migrações: $MIGRATIONS_DIR" "Yellow"
Write-Log "Log file: $LOG_FILE" "Yellow"
Write-Log ""

# Verificar se o diretório de migrações existe
if (-not (Test-Path $MIGRATIONS_DIR)) {
    Write-Log "❌ ERRO: Diretório de migrações não encontrado: $MIGRATIONS_DIR" "Red"
    exit 1
}

# Obter todas as migrações em ordem
$migrations = Get-ChildItem -Path $MIGRATIONS_DIR -Filter "*.sql" | Sort-Object Name

Write-Log "📋 Encontradas $($migrations.Count) arquivos de migração" "Green"
Write-Log ""

# Perguntar confirmação
Write-Host "⚠️  ATENÇÃO: Este script irá aplicar TODAS as $($migrations.Count) migrações no banco Neon (PRODUÇÃO)!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Deseja continuar? (S/N): " -NoNewline -ForegroundColor Yellow
$confirmation = Read-Host

if ($confirmation -ne "S" -and $confirmation -ne "s") {
    Write-Log "❌ Operação cancelada pelo usuário" "Red"
    exit 0
}

Write-Log ""
Write-Log "=========================================" "Cyan"
Write-Log "APLICANDO MIGRAÇÕES" "Cyan"
Write-Log "=========================================" "Cyan"
Write-Log ""

$successCount = 0
$failCount = 0
$skippedCount = 0

# Aplicar cada migração
foreach ($migration in $migrations) {
    $migrationName = $migration.Name
    $migrationPath = $migration.FullName
    
    Write-Log "----------------------------------------" "Cyan"
    Write-Log "📄 Migração: $migrationName" "White"
    Write-Log "----------------------------------------" "Cyan"
    
    # Verificar se a migração já foi aplicada (se houver tabela de controle)
    # Por ora, vamos aplicar todas
    
    try {
        # Configurar password
        $env:PGPASSWORD = $NEON_PASSWORD
        
        # Executar migração
        Write-Log "   Executando..." "Yellow"
        
        $output = & psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -f $migrationPath 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "   ✅ SUCESSO" "Green"
            $successCount++
            
            # Log do output (resumido)
            $output | Select-Object -First 5 | ForEach-Object {
                Write-Log "      $_" "Gray"
            }
        } else {
            Write-Log "   ⚠️  AVISO/ERRO (exit code: $LASTEXITCODE)" "Yellow"
            
            # Verificar se é um erro crítico ou apenas warnings
            $errorLines = $output | Where-Object { $_ -match "ERROR|FATAL" }
            
            if ($errorLines.Count -gt 0) {
                Write-Log "   ❌ ERRO CRÍTICO" "Red"
                $failCount++
                
                $errorLines | ForEach-Object {
                    Write-Log "      $_" "Red"
                }
                
                Write-Log ""
                Write-Log "Deseja continuar com as próximas migrações? (S/N): " "Yellow" -NoNewline
                $continueConfirmation = Read-Host
                
                if ($continueConfirmation -ne "S" -and $continueConfirmation -ne "s") {
                    Write-Log "❌ Processo interrompido pelo usuário após erro" "Red"
                    break
                }
            } else {
                # Apenas warnings, provavelmente objetos já existem
                Write-Log "   ℹ️  Migração já aplicada ou com warnings não-críticos" "Cyan"
                $skippedCount++
            }
        }
        
    } catch {
        Write-Log "   ❌ EXCEÇÃO: $($_.Exception.Message)" "Red"
        $failCount++
        
        Write-Log ""
        Write-Log "Deseja continuar com as próximas migrações? (S/N): " "Yellow" -NoNewline
        $continueConfirmation = Read-Host
        
        if ($continueConfirmation -ne "S" -and $continueConfirmation -ne "s") {
            Write-Log "❌ Processo interrompido pelo usuário após exceção" "Red"
            break
        }
    }
    
    Write-Log ""
    Start-Sleep -Milliseconds 500
}

# Limpar variável de ambiente
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Log "=========================================" "Cyan"
Write-Log "PROCESSO FINALIZADO" "Cyan"
Write-Log "=========================================" "Cyan"
Write-Log ""
Write-Log "📊 RESUMO:" "White"
Write-Log "   ✅ Sucessos:    $successCount" "Green"
Write-Log "   ⚠️  Warnings:   $skippedCount" "Yellow"
Write-Log "   ❌ Falhas:      $failCount" "Red"
Write-Log "   📄 Total:       $($migrations.Count)" "Cyan"
Write-Log ""
Write-Log "📄 Log completo salvo em: $LOG_FILE" "Cyan"
Write-Log ""

if ($failCount -eq 0) {
    Write-Log "✅ TODAS AS MIGRAÇÕES FORAM APLICADAS COM SUCESSO!" "Green"
} elseif ($failCount -lt 5) {
    Write-Log "⚠️  PROCESSO CONCLUÍDO COM ALGUNS ERROS" "Yellow"
    Write-Log "   Revise o log para mais detalhes" "Yellow"
} else {
    Write-Log "❌ PROCESSO CONCLUÍDO COM MUITOS ERROS" "Red"
    Write-Log "   Revise o log e corrija os problemas antes de prosseguir" "Red"
}

Write-Log ""
Write-Log "=========================================" "Cyan"
Write-Log "PRÓXIMOS PASSOS" "Cyan"
Write-Log "=========================================" "Cyan"
Write-Log ""
Write-Log "1️⃣  Revisar o log: $LOG_FILE" "Yellow"
Write-Log "2️⃣  Validar estrutura do banco Neon" "Yellow"
Write-Log "3️⃣  Executar testes de integração" "Yellow"
Write-Log "4️⃣  Fazer deploy do código atualizado" "Yellow"
Write-Log ""
