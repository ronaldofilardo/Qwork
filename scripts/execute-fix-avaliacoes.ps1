# Script PowerShell para executar correção de avaliações completas
# Executa o script SQL no banco de produção Neon

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CORREÇÃO DE AVALIAÇÕES COMPLETAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Banco de produção Neon
$NEON_DB = "postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

Write-Host "Executando correção no banco de PRODUÇÃO (Neon)..." -ForegroundColor Yellow
Write-Host ""

# Executar no banco de produção (usando script adaptado para Neon)
psql $NEON_DB -f "C:\apps\QWork\scripts\fix-avaliacoes-completas-neon.sql"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Correção concluída!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Verificar dashboard do funcionário (deve mostrar 'Ver Comprovante')" -ForegroundColor White
Write-Host "2. Verificar dashboard RH/Entidade (deve mostrar 'Solicitar emissão')" -ForegroundColor White
Write-Host "3. Verificar notificações criadas" -ForegroundColor White
Write-Host ""
Write-Host "Para testar nova avaliação:" -ForegroundColor Yellow
Write-Host "- Funcionário responde 37 perguntas" -ForegroundColor White
Write-Host "- Sistema marca automaticamente como concluída" -ForegroundColor White
Write-Host "- Redireciona para dashboard com botão 'Ver Comprovante'" -ForegroundColor White
