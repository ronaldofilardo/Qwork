# ====================================================================
# BACKUP neondb_v2 (PROD) — Phase 1 do Sync PROD→STAGING
# Data: 24/04/2026
# Branch: feature/v2
# Target: neondb_v2 (Neon PROD)
# ====================================================================
# Cria backup físico via pg_dump (custom format) + dump COPY CSV por tabela.
# Salva em: backups/prod_v2_backup_<YYYYMMDD_HHmmss>/
#
# Pré-requisito: pg_dump + psql no PATH + NEON_PROD_PASSWORD definida
#
# Uso:
#   $env:NEON_PROD_PASSWORD = 'sua_senha'
#   .\scripts\backup-prod-v2.ps1
#   .\scripts\backup-prod-v2.ps1 -SkipDump   # apenas verifica estado atual
# ====================================================================

param(
    [switch]$SkipDump   # Pula pg_dump, apenas registra estado do banco
)

$NEON_HOST = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$NEON_DB   = "neondb_v2"
$TIMESTAMP = (Get-Date -Format "yyyyMMdd_HHmmss")
$BACKUP_DIR = "C:\apps\QWork\backups\prod_v2_backup_$TIMESTAMP"

# Ler senha de variável de ambiente (OBRIGATÓRIO)
if ($env:NEON_PROD_PASSWORD) {
    $env:PGPASSWORD = $env:NEON_PROD_PASSWORD
} else {
    Write-Host "ERRO: Variavel de ambiente NEON_PROD_PASSWORD nao definida." -ForegroundColor Red
    Write-Host "  Defina com: `$env:NEON_PROD_PASSWORD = 'sua_senha'" -ForegroundColor Yellow
    exit 1
}

$env:PGSSLMODE     = "require"
$env:PGSSLCERTMODE = "allow"

$PROD_CONN = "postgresql://neondb_owner:$($env:NEON_PROD_PASSWORD)@$NEON_HOST/$NEON_DB`?sslmode=require&sslcertmode=allow"

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  BACKUP PROD — neondb_v2 @ Neon" -ForegroundColor Cyan
Write-Host "  Destino: $BACKUP_DIR" -ForegroundColor Gray
Write-Host "  Timestamp: $TIMESTAMP" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# ====================================================================
# ESTADO ATUAL DO BANCO (sempre executa)
# ====================================================================
Write-Host "Estado atual de neondb_v2:" -ForegroundColor Magenta
Write-Host ""
Write-Host "  [1/3] Contagens de tabelas criticas:" -ForegroundColor Gray
psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "
    SELECT 'clinicas'           AS tabela, count(*) FROM clinicas       UNION ALL
    SELECT 'entidades',          count(*) FROM entidades                UNION ALL
    SELECT 'empresas_clientes',  count(*) FROM empresas_clientes        UNION ALL
    SELECT 'funcionarios',       count(*) FROM funcionarios             UNION ALL
    SELECT 'avaliacoes',         count(*) FROM avaliacoes               UNION ALL
    SELECT 'respostas',          count(*) FROM respostas                UNION ALL
    SELECT 'laudos',             count(*) FROM laudos                   UNION ALL
    SELECT 'lotes_avaliacao',    count(*) FROM lotes_avaliacao          UNION ALL
    SELECT 'contratos',          count(*) FROM contratos                UNION ALL
    SELECT 'pagamentos',         count(*) FROM pagamentos               UNION ALL
    SELECT 'usuarios',           count(*) FROM usuarios                 UNION ALL
    SELECT 'representantes',     count(*) FROM representantes           UNION ALL
    SELECT 'schema_migrations',  count(*) FROM schema_migrations
    ORDER BY 1;
" 2>&1

Write-Host ""
Write-Host "  [2/3] Ultimas migrations:" -ForegroundColor Gray
psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "
    SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 20;
" 2>&1

Write-Host ""
Write-Host "  [3/3] Colunas legacy (deve ser 0 linhas — confirmacao de schema limpo):" -ForegroundColor Gray
psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema='public'
      AND column_name IN ('pagamento_confirmado','data_liberacao_login','plano_id','contratante_id','valor_personalizado')
      AND table_name IN ('clinicas','entidades','contratos','lotes_avaliacao')
    ORDER BY 1, 2;
" 2>&1

Write-Host ""

if ($SkipDump) {
    Write-Host "Modo -SkipDump: backup fisico nao criado." -ForegroundColor Yellow
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    exit 0
}

# ====================================================================
# CRIAR DIRETÓRIO DE BACKUP
# ====================================================================
New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
Write-Host "Diretorio criado: $BACKUP_DIR" -ForegroundColor Gray
Write-Host ""

# ====================================================================
# pg_dump — dump completo (schema + data) em formato custom
# ====================================================================
Write-Host "Executando pg_dump (formato custom — inclui schema + data)..." -ForegroundColor Cyan -NoNewline
$dumpFile = "$BACKUP_DIR\neondb_v2_full_$TIMESTAMP.dump"
pg_dump -h $NEON_HOST -U $NEON_USER -d $NEON_DB -Fc --no-acl --no-owner -f $dumpFile 2>&1
$dumpExit = $LASTEXITCODE

if ($dumpExit -eq 0 -and (Test-Path $dumpFile)) {
    $sz = [math]::Round((Get-Item $dumpFile).Length / 1MB, 2)
    Write-Host " OK ($sz MB)" -ForegroundColor Green
} else {
    Write-Host " WARN (pg_dump pode ter retornado warnings)" -ForegroundColor Yellow
    Write-Host "  Verifique $dumpFile manualmente." -ForegroundColor DarkYellow
}

Write-Host ""

# ====================================================================
# SALVAR ESTADO (schema_migrations atual) como JSON de referência
# ====================================================================
Write-Host "Salvando estado de schema_migrations..." -ForegroundColor Cyan -NoNewline
$stateFile = "$BACKUP_DIR\schema_migrations_state.txt"
psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "
    SELECT version FROM schema_migrations ORDER BY version;
" > $stateFile 2>&1
Write-Host " OK" -ForegroundColor Green

# ====================================================================
# SALVAR ROW COUNTS
# ====================================================================
Write-Host "Salvando row counts..." -ForegroundColor Cyan -NoNewline
$countsFile = "$BACKUP_DIR\row_counts.txt"
psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "
    SELECT schemaname, tablename, n_live_tup AS estimated_rows
    FROM pg_stat_user_tables
    ORDER BY tablename;
" > $countsFile 2>&1
Write-Host " OK" -ForegroundColor Green

# ====================================================================
# RESULTADO FINAL
# ====================================================================
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  BACKUP CONCLUIDO!" -ForegroundColor Green
Write-Host "  Arquivos em: $BACKUP_DIR" -ForegroundColor Gray
Write-Host ""
Write-Host "  Para restaurar (se necessário):" -ForegroundColor Yellow
Write-Host "  pg_restore -h $NEON_HOST -U $NEON_USER -d neondb_v2 -Fc $dumpFile" -ForegroundColor DarkYellow
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
exit 0
