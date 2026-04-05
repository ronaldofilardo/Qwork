#!/usr/bin/env pwsh
# =====================================================
# Apply Migration 1008 to Production Database (Neon)
# =====================================================
# This script applies the entidade_id migration to PROD

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

# =====================================================
# Configuration
# =====================================================

$ProdDatabaseUrl = "postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$MigrationFile1 = "database/migrations/1008_add_entidade_id_to_lotes_avaliacao.sql"
$MigrationFile2 = "database/migrations/1008b_fix_entidade_segregation.sql"

# =====================================================
# Helper Functions
# =====================================================

function Test-MigrationFile {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        Write-Error "❌ Arquivo não encontrado: $FilePath"
        return $false
    }
    Write-Host "✅ Arquivo encontrado: $FilePath"
    return $true
}

function Execute-Migration {
    param(
        [string]$FilePath,
        [string]$DatabaseUrl,
        [string]$MigrationNumber
    )
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "Executando Migration $MigrationNumber" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    if (-not (Test-MigrationFile $FilePath)) {
        return $false
    }
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Não executando migração" -ForegroundColor Yellow
        return $true
    }
    
    try {
        Write-Host "⏳ Executando: $FilePath"
        
        # Parse connection string to extract psql parameters
        if ($DatabaseUrl -match 'postgresql://([^:]+):([^@]+)@([^/]+)/(.+)') {
            $DbUser = $matches[1]
            $DbPassword = $matches[2]
            $DbHost = $matches[3]
            $DbName = $matches[4].Split('?')[0]
            
            # Set password in environment
            $env:PGPASSWORD = $DbPassword
            
            # Execute migration
            $result = & psql -U $DbUser -h $DbHost -d $DbName -f $FilePath 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Migration $MigrationNumber executada com sucesso" -ForegroundColor Green
                
                if ($Verbose) {
                    Write-Host "Output:" -ForegroundColor Gray
                    Write-Host $result | Out-String
                }
                return $true
            } else {
                Write-Host "❌ Migration $MigrationNumber falhou" -ForegroundColor Red
                Write-Host "Error output:" -ForegroundColor Red
                Write-Host $result | Out-String
                return $false
            }
        } else {
            Write-Error "❌ Não foi possível fazer parse da DATABASE_URL"
            return $false
        }
    }
    catch {
        Write-Error "❌ Erro ao executar migration: $_"
        return $false
    }
    finally {
        # Clear password from environment
        $env:PGPASSWORD = $null
    }
}

function Validate-Production {
    param([string]$DatabaseUrl)
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "Validando Estado de PRODUÇÃO" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    $ValidationScript = @"
SELECT 
  'Lotes Entidade' as status,
  COUNT(CASE WHEN entidade_id IS NOT NULL THEN 1 END) as lotes_entidade,
  COUNT(CASE WHEN clinica_id IS NOT NULL THEN 1 END) as lotes_clinica,
  COUNT(*) as total_lotes
FROM lotes_avaliacao;

SELECT 
  'Lotes Invalidos' as status,
  COUNT(*) as violacoes
FROM lotes_avaliacao 
WHERE (entidade_id IS NOT NULL AND clinica_id IS NOT NULL)
   OR (entidade_id IS NULL AND clinica_id IS NULL);
"@

    try {
        if ($DatabaseUrl -match 'postgresql://([^:]+):([^@]+)@([^/]+)/(.+)') {
            $DbUser = $matches[1]
            $DbPassword = $matches[2]
            $DbHost = $matches[3]
            $DbName = $matches[4].Split('?')[0]
            
            $env:PGPASSWORD = $DbPassword
            
            $result = & psql -U $DbUser -h $DbHost -d $DbName -c $ValidationScript 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Validação concluída" -ForegroundColor Green
                Write-Host $result | Out-String
                return $true
            } else {
                Write-Host "❌ Erro na validação" -ForegroundColor Red
                Write-Host $result | Out-String
                return $false
            }
        }
    }
    catch {
        Write-Error "❌ Erro ao validar: $_"
        return $false
    }
    finally {
        $env:PGPASSWORD = $null
    }
}

# =====================================================
# Main Script
# =====================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Migration 1008 - Production Database (Neon)      ║" -ForegroundColor Cyan
Write-Host "║  Aplicar segregação de entidade_id vs clinica_id  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "🔍 MODO DRY RUN - Nenhuma mudança será feita" -ForegroundColor Yellow
}

# Step 1: Validate environment
Write-Host ""
Write-Host "ℹ️  Conectando a PRODUÇÃO..."
Write-Host "Host: ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech" -ForegroundColor Gray
Write-Host "Database: neondb" -ForegroundColor Gray

# Step 2: Execute migrations
$success1 = Execute-Migration -FilePath $MigrationFile1 -DatabaseUrl $ProdDatabaseUrl -MigrationNumber 1008
if (-not $success1) {
    Write-Host "❌ Migration 1008 falhou. Abortando." -ForegroundColor Red
    exit 1
}

$success2 = Execute-Migration -FilePath $MigrationFile2 -DatabaseUrl $ProdDatabaseUrl -MigrationNumber "1008b"
if (-not $success2) {
    Write-Host "⚠️  Migration 1008b falhou, mas 1008 foi aplicada." -ForegroundColor Yellow
}

# Step 3: Validate result
$validationOk = Validate-Production -DatabaseUrl $ProdDatabaseUrl

# Step 4: Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Resumo" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($success1 -and $success2 -and $validationOk) {
    Write-Host "✅ Migration 1008 CONCLUÍDA COM SUCESSO EM PRODUÇÃO" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Green
    Write-Host "1. Verificar logs das APIs de entidade" -ForegroundColor Green
    Write-Host "2. Testar endpoints:" -ForegroundColor Green
    Write-Host "   - GET /api/entidade/relatorio-individual-pdf" -ForegroundColor Green
    Write-Host "   - GET /api/entidade/relatorio-lote-pdf" -ForegroundColor Green
    Write-Host "3. Monitorar erros de PROD" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Falha na migração ou validação" -ForegroundColor Red
    exit 1
}
