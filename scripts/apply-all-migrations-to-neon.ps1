# Script: Aplicar TODAS as migrations do local para o Neon
# Objetivo: Garantir que o schema do Neon fique idêntico ao local
# Data: 2026-02-02

param(
    [switch]$DryRun = $false,
    [switch]$ContinueOnError = $true
)

$ErrorActionPreference = "Continue"

# Configuração
$migrationsDir = "database\migrations"
$logFile = "logs\migration-neon-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"
$DATABASE_URL = $env:DATABASE_URL

if (-not $DATABASE_URL) {
    Write-Host "❌ ERRO: DATABASE_URL não configurada" -ForegroundColor Red
    exit 1
}

# Criar diretório de logs se não existir
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Função para log
function Write-Log {
    param($Message, $Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor $Color
    Add-Content -Path $logFile -Value $logMessage
}

# Obter todas as migrations em ordem
$migrations = Get-ChildItem "$migrationsDir\*.sql" | Sort-Object Name

Write-Log "════════════════════════════════════════════════════════════" "Cyan"
Write-Log "APLICAÇÃO DE MIGRATIONS NO NEON (PRODUÇÃO)" "Cyan"
Write-Log "════════════════════════════════════════════════════════════" "Cyan"
Write-Log "Total de migrations encontradas: $($migrations.Count)" "Yellow"
Write-Log "Modo: $(if ($DryRun) { 'DRY RUN (apenas simulação)' } else { 'EXECUÇÃO REAL' })" "Yellow"
Write-Log "Log: $logFile" "Yellow"
Write-Log ""

$stats = @{
    Total = $migrations.Count
    Sucesso = 0
    JaExistente = 0
    Erro = 0
    Pulado = 0
}

$erros = @()

foreach ($migration in $migrations) {
    $migrationName = $migration.Name
    Write-Log "──────────────────────────────────────────────────────────" "Gray"
    Write-Log "Processando: $migrationName" "Cyan"
    
    if ($DryRun) {
        Write-Log "  [DRY RUN] Seria executada" "Yellow"
        $stats.Pulado++
        continue
    }
    
    try {
        # Executar migration
        $output = psql $DATABASE_URL -f $migration.FullName 2>&1
        $exitCode = $LASTEXITCODE
        
        # Analisar resultado
        $outputStr = $output | Out-String
        
        if ($exitCode -eq 0) {
            # Sucesso total
            Write-Log "  ✅ Aplicada com sucesso" "Green"
            $stats.Sucesso++
        }
        elseif ($outputStr -match "already exists|IF NOT EXISTS|does not exist, skipping") {
            # Elementos já existentes (não é erro crítico)
            Write-Log "  ⚠️  Elementos já existentes (esperado)" "Yellow"
            $stats.JaExistente++
        }
        elseif ($outputStr -match "ERROR.*column.*does not exist") {
            # Coluna faltante - migration depende de outra não aplicada ainda
            Write-Log "  ⚠️  Coluna faltante - dependência não aplicada" "Yellow"
            Write-Log "     Detalhes: $($outputStr -replace '[\r\n]+', ' ' | Select-Object -First 200)" "DarkYellow"
            $erros += [PSCustomObject]@{
                Migration = $migrationName
                Tipo = "Dependência faltante"
                Erro = $outputStr.Substring(0, [Math]::Min(200, $outputStr.Length))
            }
            
            if ($ContinueOnError) {
                $stats.Erro++
            } else {
                throw "Migration falhou e ContinueOnError = false"
            }
        }
        elseif ($exitCode -ne 0) {
            # Outro tipo de erro
            Write-Log "  ❌ Erro na execução" "Red"
            Write-Log "     Detalhes: $($outputStr -replace '[\r\n]+', ' ' | Select-Object -First 200)" "DarkRed"
            $erros += [PSCustomObject]@{
                Migration = $migrationName
                Tipo = "Erro de execução"
                Erro = $outputStr.Substring(0, [Math]::Min(200, $outputStr.Length))
            }
            
            if ($ContinueOnError) {
                $stats.Erro++
            } else {
                throw "Migration falhou e ContinueOnError = false"
            }
        }
        
    }
    catch {
        Write-Log "  ❌ Exceção: $($_.Exception.Message)" "Red"
        $erros += [PSCustomObject]@{
            Migration = $migrationName
            Tipo = "Exceção"
            Erro = $_.Exception.Message
        }
        
        if (-not $ContinueOnError) {
            throw
        }
        $stats.Erro++
    }
}

# Resumo final
Write-Log ""
Write-Log "════════════════════════════════════════════════════════════" "Cyan"
Write-Log "RESUMO DA EXECUÇÃO" "Cyan"
Write-Log "════════════════════════════════════════════════════════════" "Cyan"
Write-Log "Total de migrations:      $($stats.Total)" "White"
Write-Log "✅ Aplicadas com sucesso:  $($stats.Sucesso)" "Green"
Write-Log "⚠️  Já existentes:         $($stats.JaExistente)" "Yellow"
Write-Log "❌ Com erro:               $($stats.Erro)" "Red"
Write-Log "⏭️  Puladas (dry run):     $($stats.Pulado)" "Yellow"
Write-Log ""

if ($erros.Count -gt 0) {
    Write-Log "════════════════════════════════════════════════════════════" "Red"
    Write-Log "ERROS DETALHADOS ($($erros.Count) migrations com problemas)" "Red"
    Write-Log "════════════════════════════════════════════════════════════" "Red"
    
    foreach ($erro in $erros) {
        Write-Log "Migration: $($erro.Migration)" "Yellow"
        Write-Log "Tipo:      $($erro.Tipo)" "Yellow"
        Write-Log "Erro:      $($erro.Erro)" "DarkRed"
        Write-Log ""
    }
    
    # Salvar erros em arquivo separado
    $errosFile = "logs\migration-errors-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').json"
    $erros | ConvertTo-Json -Depth 3 | Out-File $errosFile
    Write-Log "Erros salvos em: $errosFile" "Yellow"
}

Write-Log ""
Write-Log "Log completo salvo em: $logFile" "Cyan"
Write-Log "════════════════════════════════════════════════════════════" "Cyan"

# Retornar código de saída baseado nos resultados
if ($stats.Erro -gt ($stats.Total * 0.1)) {
    # Se mais de 10% falharam, considerar falha crítica
    exit 1
}
exit 0
