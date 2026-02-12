#!/usr/bin/env pwsh
# ============================================================================
# Script Auxiliar: Encontrar DATABASE_URL de Produção
# ============================================================================
# Este script ajuda a encontrar a DATABASE_URL de produção

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Auxiliar: Encontrar DATABASE_URL de Produção             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host ""
Write-Host "A DATABASE_URL de produção pode estar em:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. NEON CONSOLE (Recomendado)"
Write-Host "   ├─ Acesse: https://console.neon.tech"
Write-Host "   ├─ Selecione seu projeto"
Write-Host "   ├─ Vá em: Databases → neondb → Connection"
Write-Host "   └─ Copie a string de conexão PostgreSQL"
Write-Host ""

Write-Host "2. VERCEL DASHBOARD"
Write-Host "   ├─ Acesse: https://vercel.com/dashboard"
Write-Host "   ├─ Selecione seu projeto QWork"
Write-Host "   ├─ Vá em: Settings → Environment Variables"
Write-Host "   ├─ Procure por: DATABASE_URL"
Write-Host "   └─ Copie o valor (inteiro, começando com postgresql://)"
Write-Host ""

Write-Host "3. ARQUIVO .env EM PRODUÇÃO"
Write-Host "   ├─ Se você tem acesso ao servidor"
Write-Host "   ├─ Ver arquivo: /path/to/.env"
Write-Host "   └─ Procure pela chave DATABASE_URL"
Write-Host ""

Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "• Deve começar com: postgresql://"
Write-Host "• Exemplo formato:"
Write-Host "  postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
Write-Host ""

Write-Host "PRÓXIMO PASSO:" -ForegroundColor Green
Write-Host '.\PRODUCAO_executar_migration_aceites.ps1 -DatabaseUrl "postgresql://..."'
Write-Host ""
