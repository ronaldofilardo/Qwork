# Script de Sincronização: Neon Cloud → Banco Local (nr-bps_db)
# 
# Este script sincroniza o banco local com o Neon (fonte da verdade):
# - Schema (estrutura de tabelas, views, funções, triggers)
# - Dados (INSERT de todos os registros)
# - Migrações aplicadas

$ErrorActionPreference = "Stop"

Write-Host "🔄 Sincronizando Neon Cloud → nr-bps_db local..." -ForegroundColor Cyan
Write-Host ""

# ========================================
# CONFIGURAÇÕES
# ========================================

# Banco NEON (fonte da verdade)
$NEON_URL = "postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

# Banco LOCAL (destino)
$LOCAL_HOST = "localhost"
$LOCAL_PORT = "5432"
$LOCAL_DB = "nr-bps_db"
$LOCAL_USER = "postgres"
$LOCAL_PASSWORD = "123456"
$Env:PGPASSWORD = $LOCAL_PASSWORD

# Diretórios de trabalho
$BACKUP_DIR = ".\scripts\backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$SCHEMA_FILE = "$BACKUP_DIR\neon_schema_$TIMESTAMP.sql"
$DATA_FILE = "$BACKUP_DIR\neon_data_$TIMESTAMP.sql"

# ========================================
# VERIFICAÇÕES INICIAIS
# ========================================

Write-Host "📋 Verificando pré-requisitos..." -ForegroundColor Yellow

# Criar diretório de backups se não existir
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "✅ Diretório de backups criado: $BACKUP_DIR" -ForegroundColor Green
}

# Verificar se pg_dump existe
try {
    $pgDumpVersion = & pg_dump --version 2>&1
    Write-Host "✅ pg_dump encontrado: $pgDumpVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO: pg_dump não encontrado no PATH" -ForegroundColor Red
    Write-Host "   Instale o PostgreSQL client tools ou adicione ao PATH" -ForegroundColor Yellow
    exit 1
}

# Verificar se psql existe
try {
    $psqlVersion = & psql --version 2>&1
    Write-Host "✅ psql encontrado: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO: psql não encontrado no PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ========================================
# BACKUP DO BANCO LOCAL (SEGURANÇA)
# ========================================

Write-Host "💾 Fazendo backup do banco local (segurança)..." -ForegroundColor Yellow

$LOCAL_BACKUP = "$BACKUP_DIR\local_backup_$TIMESTAMP.sql"

try {
    & pg_dump -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -F c -f $LOCAL_BACKUP 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        $backupSize = (Get-Item $LOCAL_BACKUP).Length / 1MB
        Write-Host "✅ Backup local criado: $LOCAL_BACKUP ($([math]::Round($backupSize, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Aviso: Falha no backup local (banco pode não existir ainda)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Aviso: Erro ao fazer backup local: $_" -ForegroundColor Yellow
    Write-Host "   Continuando com sincronização..." -ForegroundColor Yellow
}

Write-Host ""

# ========================================
# EXPORTAR SCHEMA DO NEON
# ========================================

Write-Host "📥 Exportando schema do Neon..." -ForegroundColor Yellow

try {
    & pg_dump $NEON_URL --schema-only --no-owner --no-privileges -f $SCHEMA_FILE 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERRO ao exportar schema do Neon" -ForegroundColor Red
        exit 1
    }
    
    $schemaSize = (Get-Item $SCHEMA_FILE).Length / 1KB
    Write-Host "✅ Schema exportado: $SCHEMA_FILE ($([math]::Round($schemaSize, 2)) KB)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ========================================
# EXPORTAR DADOS DO NEON
# ========================================

Write-Host "📥 Exportando dados do Neon..." -ForegroundColor Yellow

try {
    & pg_dump $NEON_URL --data-only --no-owner --no-privileges --disable-triggers -f $DATA_FILE 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERRO ao exportar dados do Neon" -ForegroundColor Red
        exit 1
    }
    
    $dataSize = (Get-Item $DATA_FILE).Length / 1MB
    Write-Host "✅ Dados exportados: $DATA_FILE ($([math]::Round($dataSize, 2)) MB)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ========================================
# LIMPAR BANCO LOCAL (mantém banco existente)
# ========================================

Write-Host "🧹 Limpando dados do banco local (mantendo estrutura)..." -ForegroundColor Yellow

# Verificar se banco existe
Write-Host "   Verificando existência do banco nr-bps_db..." -ForegroundColor Gray
$dbExists = & psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$LOCAL_DB';" 2>&1

if ($dbExists -match "1") {
    Write-Host "   ✅ Banco nr-bps_db encontrado" -ForegroundColor Green
    
    # Dropar todas as tabelas do schema public
    Write-Host "   Limpando tabelas existentes..." -ForegroundColor Gray
    $dropScript = @"
DO `$`$ DECLARE
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all sequences
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
    
    -- Drop all views
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;
    
    -- Drop all functions
    FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
    END LOOP;
END `$`$;
"@
    
    $dropScript | & psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Banco limpo com sucesso" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Aviso: Alguns objetos podem não ter sido removidos" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Banco nr-bps_db não existe, será criado" -ForegroundColor Yellow
    & psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d postgres -c "CREATE DATABASE $LOCAL_DB;" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ ERRO ao criar banco local" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ Banco criado" -ForegroundColor Green
}

Write-Host ""

# ========================================
# IMPORTAR SCHEMA
# ========================================

Write-Host "📤 Importando schema para banco local..." -ForegroundColor Yellow

try {
    & psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -f $SCHEMA_FILE 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERRO ao importar schema" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Schema importado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ========================================
# IMPORTAR DADOS
# ========================================

Write-Host "📤 Importando dados para banco local..." -ForegroundColor Yellow

try {
    & psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -f $DATA_FILE 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Aviso: Alguns dados podem ter falhado (constraints, etc.)" -ForegroundColor Yellow
    }
    
    Write-Host "✅ Dados importados" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Aviso: Erro ao importar dados: $_" -ForegroundColor Yellow
}

Write-Host ""

# ========================================
# VERIFICAÇÃO PÓS-SINCRONIZAÇÃO
# ========================================

Write-Host "🔍 Verificando sincronização..." -ForegroundColor Yellow

# Contar tabelas
$tabelasQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
$numTabelas = & psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -t -c $tabelasQuery 2>&1
Write-Host "   📊 Tabelas: $($numTabelas.Trim())" -ForegroundColor Cyan

# Contar registros em algumas tabelas principais
$tabelas = @("contratantes", "clinicas", "empresas", "funcionarios", "lotes_avaliacao", "avaliacoes")

foreach ($tabela in $tabelas) {
    $countQuery = "SELECT COUNT(*) FROM $tabela;"
    $count = & psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -t -c $countQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   📋 $tabela : $($count.Trim()) registros" -ForegroundColor Cyan
    }
}

Write-Host ""

# ========================================
# ATUALIZAR .env.local
# ========================================

Write-Host "⚙️  Atualizando .env.local..." -ForegroundColor Yellow

$envFile = ".\.env.local"

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    
    # Nova URL do banco local
    $newLocalUrl = "postgresql://${LOCAL_USER}:${LOCAL_PASSWORD}@${LOCAL_HOST}:${LOCAL_PORT}/${LOCAL_DB}"
    
    # Substituir LOCAL_DATABASE_URL
    if ($envContent -match "LOCAL_DATABASE_URL=.*") {
        $envContent = $envContent -replace "LOCAL_DATABASE_URL=.*", "LOCAL_DATABASE_URL=$newLocalUrl"
        Write-Host "   ✅ LOCAL_DATABASE_URL atualizada" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  LOCAL_DATABASE_URL não encontrada no .env.local" -ForegroundColor Yellow
    }
    
    # Salvar
    $envContent | Set-Content $envFile -NoNewline
    
    Write-Host "✅ .env.local atualizado para usar banco local" -ForegroundColor Green
} else {
    Write-Host "⚠️  Arquivo .env.local não encontrado" -ForegroundColor Yellow
}

Write-Host ""

# ========================================
# RESUMO FINAL
# ========================================

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Arquivos gerados:" -ForegroundColor Cyan
Write-Host "   - Backup local: $LOCAL_BACKUP" -ForegroundColor White
Write-Host "   - Schema Neon: $SCHEMA_FILE" -ForegroundColor White
Write-Host "   - Dados Neon: $DATA_FILE" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Reinicie o servidor de desenvolvimento: pnpm dev" -ForegroundColor White
Write-Host "   2. Verifique a conexão no pgAdmin" -ForegroundColor White
Write-Host "   3. Execute os testes: pnpm test" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Importante:" -ForegroundColor Yellow
Write-Host "   - O banco local agora é uma CÓPIA do Neon" -ForegroundColor White
Write-Host "   - Mudanças locais NÃO afetam produção" -ForegroundColor White
Write-Host "   - Re-sincronize periodicamente para atualizações" -ForegroundColor White
Write-Host ""
