# Script para aplicar migrations das Fases 1 e 2
# Data: 2026-01-29

$ErrorActionPreference = "Stop"

Write-Host "=== APLICAÇÃO DE MIGRATIONS - FASES 1 E 2 ===" -ForegroundColor Cyan
Write-Host ""

# Configuração do banco
$DB_HOST = $env:PGHOST ?? "localhost"
$DB_PORT = $env:PGPORT ?? "5432"
$DB_NAME = $env:PGDATABASE ?? "postgres"
$DB_USER = $env:PGUSER ?? "postgres"

Write-Host "Configuração:" -ForegroundColor Yellow
Write-Host "  Host: $DB_HOST"
Write-Host "  Port: $DB_PORT"
Write-Host "  Database: $DB_NAME"
Write-Host "  User: $DB_USER"
Write-Host ""

# Verificar se psql está disponível
try {
    $null = Get-Command psql -ErrorAction Stop
} catch {
    Write-Host "ERRO: psql não encontrado. Instale PostgreSQL client." -ForegroundColor Red
    exit 1
}

# Confirmar com usuário
Write-Host "ATENÇÃO: Este script irá modificar a estrutura do banco de dados." -ForegroundColor Yellow
Write-Host "Certifique-se de ter backup antes de continuar." -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Deseja continuar? (S/N)"

if ($confirmation -ne "S" -and $confirmation -ne "s") {
    Write-Host "Operação cancelada pelo usuário." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Iniciando aplicação de migrations..." -ForegroundColor Green
Write-Host ""

# Criar log directory
$logDir = "C:\apps\QWork\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "$logDir\migration-200-201-$timestamp.log"

function Run-Migration {
    param(
        [string]$MigrationFile,
        [string]$MigrationName
    )
    
    Write-Host "Aplicando $MigrationName..." -ForegroundColor Cyan
    
    $migrationPath = "C:\apps\QWork\database\migrations\$MigrationFile"
    
    if (-not (Test-Path $migrationPath)) {
        Write-Host "ERRO: Arquivo não encontrado: $migrationPath" -ForegroundColor Red
        exit 1
    }
    
    try {
        $env:PGPASSWORD = $env:PGPASSWORD
        
        # Executar migration e capturar output
        $output = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migrationPath 2>&1
        
        # Salvar no log
        $output | Out-File -FilePath $logFile -Append -Encoding UTF8
        
        # Verificar sucesso
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERRO ao aplicar $MigrationName" -ForegroundColor Red
            Write-Host "Verifique o log: $logFile" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Output:" -ForegroundColor Yellow
            Write-Host $output
            exit 1
        }
        
        Write-Host "✓ $MigrationName aplicada com sucesso" -ForegroundColor Green
        Write-Host ""
        
    } catch {
        Write-Host "ERRO: $_" -ForegroundColor Red
        exit 1
    }
}

# Aplicar migrations em sequência
Write-Host "=== FASE 1: Normalização de Dados ===" -ForegroundColor Magenta
Run-Migration "200_fase1_normalizacao_usuario_tipo.sql" "Migration 200"

Write-Host "=== FASE 2: Refatorar RLS ===" -ForegroundColor Magenta
Run-Migration "201_fase2_refatorar_rls.sql" "Migration 201"

Write-Host ""
Write-Host "=== VALIDAÇÃO ===" -ForegroundColor Magenta

# Validar que usuario_tipo foi criado
Write-Host "Validando enum usuario_tipo..."
$validateEnum = @"
SELECT 1 FROM pg_type WHERE typname = 'usuario_tipo_enum';
"@

$enumExists = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c $validateEnum

if ($enumExists -match "1") {
    Write-Host "✓ Enum usuario_tipo_enum criado" -ForegroundColor Green
} else {
    Write-Host "✗ Enum usuario_tipo_enum não encontrado" -ForegroundColor Red
    exit 1
}

# Validar que coluna foi adicionada
Write-Host "Validando coluna usuario_tipo..."
$validateColumn = @"
SELECT 1 FROM information_schema.columns 
WHERE table_name = 'funcionarios' 
AND column_name = 'usuario_tipo';
"@

$columnExists = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c $validateColumn

if ($columnExists -match "1") {
    Write-Host "✓ Coluna usuario_tipo adicionada" -ForegroundColor Green
} else {
    Write-Host "✗ Coluna usuario_tipo não encontrada" -ForegroundColor Red
    exit 1
}

# Validar que constraint foi criada
Write-Host "Validando constraint unificada..."
$validateConstraint = @"
SELECT 1 FROM pg_constraint 
WHERE conname = 'funcionarios_usuario_tipo_exclusivo';
"@

$constraintExists = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c $validateConstraint

if ($constraintExists -match "1") {
    Write-Host "✓ Constraint funcionarios_usuario_tipo_exclusivo criada" -ForegroundColor Green
} else {
    Write-Host "✗ Constraint funcionarios_usuario_tipo_exclusivo não encontrada" -ForegroundColor Red
    exit 1
}

# Contar registros migrados
Write-Host "Contando registros migrados..."
$countQuery = @"
SELECT 
  usuario_tipo, 
  COUNT(*) as total 
FROM funcionarios 
GROUP BY usuario_tipo 
ORDER BY usuario_tipo;
"@

Write-Host ""
Write-Host "Distribuição por usuario_tipo:" -ForegroundColor Cyan
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $countQuery

Write-Host ""
Write-Host "=== MIGRATIONS APLICADAS COM SUCESSO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Log completo salvo em: $logFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Executar testes: npm test" -ForegroundColor White
Write-Host "  2. Atualizar APIs para usar lib/funcionarios.ts" -ForegroundColor White
Write-Host "  3. Revisar documentação em docs/FASE-4-ATUALIZACAO-DOCUMENTACAO.md" -ForegroundColor White
Write-Host ""
