# ====================================================================
# SCRIPT DE ROLLBACK DE EMERGÊNCIA — PRODUÇÃO
# Data: 06/04/2026
# ====================================================================
# QUANDO USAR: Se após promover neondb_v2 para PROD ocorrer erro crítico
# 
# PASSOS DE ROLLBACK (ORDEM OBRIGATÓRIA):
# 1. Execute este script para ter a CONNECTION STRING de rollback
# 2. Acesse Vercel Dashboard → Project → Settings → Environment Variables
# 3. Encontre DATABASE_URL (Production)
# 4. Clique em "Edit" e altere para: $PROD_ROLLBACK_URL (definida abaixo)
# 5. Faça redeploy do último build estável anterior
# 
# TEMPO ESTIMADO: 2-3 minutos
# ====================================================================

$PROD_ROLLBACK_URL = "postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$PROD_V2_URL = "postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_v2?sslmode=require&channel_binding=require"

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Red
Write-Host "  ROLLBACK DE EMERGENCIA - PRODUCAO" -ForegroundColor Red
Write-Host "===================================================================" -ForegroundColor Red
Write-Host ""
Write-Host "STATUS ATUAL: neondb_v2 em PRODUCAO" -ForegroundColor Yellow
Write-Host ""
Write-Host "PARA REVERTER PARA BANCO ORIGINAL (neondb):" -ForegroundColor Cyan
Write-Host "  DATABASE_URL a configurar no Vercel (Production):" -ForegroundColor White
Write-Host ""
Write-Host "  $PROD_ROLLBACK_URL" -ForegroundColor Green
Write-Host ""
Write-Host "INSTRUÇÕES:" -ForegroundColor Cyan
Write-Host "  1. Acesse: https://vercel.com/[team]/qwork/settings/environment-variables"
Write-Host "  2. Encontre DATABASE_URL em Production"
Write-Host "  3. Edite para a URL acima"
Write-Host "  4. Faça redeploy (Deployments → último deploy estável → Redeploy)"
Write-Host ""
Write-Host "ATENÇÃO: Dados inseridos durante operação em neondb_v2 NÃO migram" -ForegroundColor Yellow
Write-Host "         automaticamente para neondb ao reverter." -ForegroundColor Yellow
Write-Host ""
Write-Host "===================================================================" -ForegroundColor Red
Write-Host "  AVANÇAR PARA neondb_v2 (confirmar promoção)" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "DATABASE_URL NOVA (neondb_v2):" -ForegroundColor White
Write-Host ""
Write-Host "  $PROD_V2_URL" -ForegroundColor Cyan
Write-Host ""

# Verificar status atual dos bancos
Write-Host "===================================================================" -ForegroundColor White
Write-Host "  VERIFICAÇÃO RÁPIDA DOS BANCOS" -ForegroundColor White
Write-Host "===================================================================" -ForegroundColor White

$env:PGPASSWORD = "REDACTED_NEON_PASSWORD"
$env:PGSSLMODE = "require"
$H = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$U = "neondb_owner"

Write-Host ""
Write-Host "neondb (PROD ATUAL):" -ForegroundColor Yellow
psql -h $H -U $U -d "neondb" -c "SELECT max(version) AS ultima_migration, (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE') AS tabelas FROM schema_migrations" 2>&1

Write-Host ""
Write-Host "neondb_v2 (TARGET PROD):" -ForegroundColor Cyan
psql -h $H -U $U -d "neondb_v2" -c "SELECT max(version) AS ultima_migration, (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE') AS tabelas FROM schema_migrations" 2>&1
