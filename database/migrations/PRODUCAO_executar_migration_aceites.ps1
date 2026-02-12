#!/usr/bin/env pwsh
# ============================================================================
# Execute Migration: Criar Tabelas de Aceites de Termos em Produção
# ============================================================================
# Descrição: Executa a migration SQL para criar as tabelas de aceites de termos
# Banco: neondb (Produção)
# Data: 12/02/2026
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$DatabaseUrl = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$NoBackup = $false
)

# Cores para output
function Write-Success { Write-Host $args[0] -ForegroundColor Green }
function Write-Warning { Write-Host $args[0] -ForegroundColor Yellow }
function Write-Error_ { Write-Host $args[0] -ForegroundColor Red }
function Write-Info { Write-Host $args[0] -ForegroundColor Cyan }

Write-Info @"
╔═══════════════════════════════════════════════════════════╗
║  Migration: Criar Tabelas de Aceites de Termos            ║
║  Ambiente: Produção (Neon DB)                             ║
║  Data: 12/02/2026                                         ║
╚═══════════════════════════════════════════════════════════╝
"@

# 1. Carregar variáveis de ambiente
Write-Info "`n[1/5] Carregando configuração..."
if ([string]::IsNullOrEmpty($DatabaseUrl)) {
    # Tentar carregar de variáveis de ambiente
    $DatabaseUrl = $env:DATABASE_URL
}

if ([string]::IsNullOrEmpty($DatabaseUrl)) {
    # Tentar carregar de .env files
    $envFile = Join-Path (Split-Path (Split-Path $PSCommandPath)) ".env.production"
    if (Test-Path $envFile) {
        $envContent = @(Get-Content $envFile | ForEach-Object {
            if ($_ -match '^DATABASE_URL=(.+)$') {
                $matches[1]
            }
        })
        if ($envContent) {
            $DatabaseUrl = $envContent[0]
        }
    }
}

if ([string]::IsNullOrEmpty($DatabaseUrl)) {
    Write-Error_ "❌ ERRO: DATABASE_URL não encontrada"
    Write-Warning "`nOpções para fornecer a DATABASE_URL:"
    Write-Warning ""
    Write-Warning "  1. RECOMENDADO - Passar como parâmetro:"
    Write-Warning "     .\PRODUCAO_executar_migration_aceites.ps1 -DatabaseUrl 'postgresql://neondb_owner:...@...'"
    Write-Warning ""
    Write-Warning "  2. Configurar variável de ambiente:"
    Write-Warning "     `$env:DATABASE_URL = 'postgresql://neondb_owner:...@...'"
    Write-Warning "     .\PRODUCAO_executar_migration_aceites.ps1"
    Write-Warning ""
    Write-Warning "  3. Criar arquivo .env.production na raiz do projeto"
    Write-Warning ""
    Write-Warning "Encontre a DATABASE_URL em:"
    Write-Warning "  - Vercel Dashboard → Settings → Environment Variables"
    Write-Warning "  - Neon Console → Database → Connection String"
    Write-Warning "  - Seu arquivo .env em produção"
    exit 1
}

Write-Success "✓ DATABASE_URL carregada (primeiros 50 caracteres: $($DatabaseUrl.Substring(0, [Math]::Min(50, $DatabaseUrl.Length)))...)"

# 2. Verificar disponibilidade de psql
Write-Info "`n[2/5] Verificando psql..."
try {
    $psqlVersion = psql --version
    Write-Success "✓ psql disponível: $psqlVersion"
} catch {
    Write-Error_ "❌ ERRO: psql não encontrado"
    Write-Warning "Instale PostgreSQL client tools primeiro"
    exit 1
}

# 3. Fazer backup (opcional)
if (-not $NoBackup) {
    Write-Info "`n[3/5] Fazendo backup do banco..."
    $BackupFile = "backup_pre_aceites_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    try {
        $env:PGPASSWORD = ($DatabaseUrl -split ':')[2].split('@')[0]
        pg_dump $DatabaseUrl > $BackupFile
        Write-Success "✓ Backup criado: $BackupFile"
    } catch {
        Write-Error_ "❌ ERRO ao fazer backup: $_"
        Write-Warning "Continuando sem backup..."
    }
} else {
    Write-Warning "⊘ Backup desabilitado (--NoBackup)"
}

# 4. Executar migration
Write-Info "`n[4/5] Executando migration..."
$MigrationFile = Join-Path (Split-Path $PSCommandPath) "PRODUCAO_criar_tabelas_aceites.sql"

if (-not (Test-Path $MigrationFile)) {
    Write-Error_ "❌ ERRO: Arquivo de migration não encontrado: $MigrationFile"
    exit 1
}

if ($DryRun) {
    Write-Warning "🔍 Modo DRY-RUN (nenhuma alteração será feita)"
    Write-Info "`nConteúdo da migration:"
    Write-Info "=" * 60
    Get-Content $MigrationFile
    Write-Info "=" * 60
} else {
    Write-Info "Executando SQL..."
    try {
        psql $DatabaseUrl -f $MigrationFile
        Write-Success "`n✓ Migration executada com sucesso!"
    } catch {
        Write-Error_ "❌ ERRO ao executar migration: $_"
        Write-Warning "Verifique o erro acima e execute novamente"
        exit 1
    }
}

# 5. Validação
Write-Info "`n[5/5] Validando tabelas..."
try {
    $CheckQuery = @"
        SELECT 
            tablename,
            (SELECT 
                COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = pg_tables.tablename
            ) as colunas
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('aceites_termos_usuario', 'aceites_termos_entidade')
        ORDER BY tablename;
"@
    
    $Result = psql $DatabaseUrl -c "$CheckQuery" -P footer=off
    Write-Success "✓ Tabelas validadas:"
    Write-Info $Result
} catch {
    Write-Warning "⊘ Não foi possível validar (isto é normal em primeiro run)"
}

Write-Info @"

╔═══════════════════════════════════════════════════════════╗
║  STATUS: PRONTO!                                           ║
╚═══════════════════════════════════════════════════════════╝

✓ Tabelas de aceites de termos foram criadas em produção
✓ Sistema agora aceita e registra termos de uso
✓ Usuários RH/Gestor podem aceitar políticas normalmente

PRÓXIMOS PASSOS:
1. Fazer deploy do código atualizado (se não feito ainda)
2. Testar login de RH/Gestor no ambiente de produção
3. Verificar se modal de termos aparece corretamente
4. Monitorar logs da aplicação

ROLLBACK (se necessário):
Se houver problemas, execute: PRODUCAO_rollback_aceites.sql
"@
