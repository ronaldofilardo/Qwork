# ====================================================================
# Script: Aplicar Migração 500 - Segregação de FKs
# Data: 2026-02-06
# ====================================================================

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " MIGRAÇÃO 500: SEGREGAÇÃO DE FOREIGN KEYS"  -ForegroundColor Cyan
Write-Host " Entidades vs Clínicas - Arquitetura Segregada" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório raiz do projeto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ ERRO: Execute este script do diretório raiz do projeto." -ForegroundColor Red
    exit 1
}

# Verificar se o arquivo de migração existe
$migrationFile = "database\migrations\500_segregar_fks_entidades_clinicas.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ ERRO: Arquivo de migração não encontrado: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Arquivo de migração encontrado" -ForegroundColor Green
Write-Host ""

# Carregar variáveis de ambiente
if (Test-Path ".env.local") {
    Write-Host "📁 Carregando .env.local..." -ForegroundColor Yellow
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)\s*=\s*(.+)\s*$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "⚠ Aviso: .env.local não encontrado" -ForegroundColor Yellow
}

# Obter conexão do banco
$DATABASE_URL = $env:DATABASE_URL
if (-not $DATABASE_URL) {
    Write-Host "❌ ERRO: DATABASE_URL não configurada" -ForegroundColor Red
    Write-Host "Configure DATABASE_URL no arquivo .env.local" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Conexão do banco configurada" -ForegroundColor Green
Write-Host ""

# Confirmar execução
Write-Host "⚠ ATENÇÃO: Esta migração irá:" -ForegroundColor Yellow
Write-Host "  1. Adicionar colunas entidade_id e/ou clinica_id em várias tabelas" -ForegroundColor White
Write-Host "  2. Remover todas as colunas contratante_id" -ForegroundColor White
Write-Host "  3. Atualizar constraints e foreign keys" -ForegroundColor White
Write-Host "  4. Criar novos indexes" -ForegroundColor White
Write-Host ""
Write-Host "Banco de dados alvo:" -ForegroundColor Cyan
Write-Host "  $DATABASE_URL" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Deseja continuar? (s/N)"
if ($confirmation -ne 's' -and $confirmation -ne 'S') {
    Write-Host "❌ Migração cancelada pelo usuário" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Executando migração..." -ForegroundColor Cyan
Write-Host ""

# Executar migração via psql
try {
    $migrationContent = Get-Content $migrationFile -Raw
    $migrationContent | psql $DATABASE_URL 2>&1 | ForEach-Object {
        $line = $_
        if ($line -match "^✓") {
            Write-Host $line -ForegroundColor Green
        } elseif ($line -match "^⚠") {
            Write-Host $line -ForegroundColor Yellow
        } elseif ($line -match "ERROR|ERRO") {
            Write-Host $line -ForegroundColor Red
        } else {
            Write-Host $line
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=====================================================================" -ForegroundColor Green
        Write-Host " ✅ MIGRAÇÃO 500 CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
        Write-Host "=====================================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Próximos passos:" -ForegroundColor Cyan
        Write-Host "  1. Revisar o output acima para verificar avisos" -ForegroundColor White
        Write-Host "  2. Atualizar código TypeScript (APIs e tipos)" -ForegroundColor White
        Write-Host "  3. Executar: npm run build" -ForegroundColor White
        Write-Host "  4. Executar: npm run test" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ ERRO: Migração falhou com código de saída $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Verifique os logs acima para detalhes" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ ERRO ao executar migração:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Certifique-se de que:" -ForegroundColor Yellow
    Write-Host "  1. psql está instalado e no PATH" -ForegroundColor White
    Write-Host "  2. DATABASE_URL está correta" -ForegroundColor White
    Write-Host "  3. Você tem permissões no banco" -ForegroundColor White
    exit 1
}
