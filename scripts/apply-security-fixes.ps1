#!/usr/bin/env pwsh
# Script para aplicar correções críticas de segurança
# Data: 2026-01-30

Write-Host "🔒 CORREÇÕES CRÍTICAS DE SEGURANÇA - QWORK" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Verificar se DATABASE_URL está definida
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERRO: DATABASE_URL não está definida!" -ForegroundColor Red
    Write-Host "Configure a variável de ambiente antes de continuar." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ DATABASE_URL configurada" -ForegroundColor Green
Write-Host ""

# Confirmar ação
Write-Host "⚠️  ATENÇÃO: Esta migration aplica correções CRÍTICAS de segurança:" -ForegroundColor Yellow
Write-Host "   1. Bloqueia placeholders de senha" -ForegroundColor White
Write-Host "   2. Aplica FORCE ROW LEVEL SECURITY" -ForegroundColor White
Write-Host "   3. Cria índices de performance RLS" -ForegroundColor White
Write-Host "   4. Corrige policies para considerar contratante_id" -ForegroundColor White
Write-Host "   5. Implementa auditoria de policies" -ForegroundColor White
Write-Host "   6. Adiciona validação obrigatória de sessão" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Deseja continuar? (sim/não)"
if ($confirmation -ne "sim") {
    Write-Host "❌ Operação cancelada pelo usuário." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "📋 FASE 1: Backup do Banco de Dados" -ForegroundColor Cyan
Write-Host "-" * 60

$backupFile = "backup_pre_security_fixes_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
Write-Host "Criando backup: $backupFile" -ForegroundColor White

try {
    pg_dump $env:DATABASE_URL > $backupFile
    Write-Host "✓ Backup criado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao criar backup: $_" -ForegroundColor Red
    Write-Host "⚠️  ATENÇÃO: Recomenda-se criar backup manual antes de continuar!" -ForegroundColor Yellow
    
    $proceed = Read-Host "Continuar sem backup? (sim/não)"
    if ($proceed -ne "sim") {
        exit 1
    }
}

Write-Host ""
Write-Host "📋 FASE 2: Verificação Pré-Migration" -ForegroundColor Cyan
Write-Host "-" * 60

Write-Host "Verificando placeholders existentes..." -ForegroundColor White
$placeholdersQuery = @"
SELECT COUNT(*) as total 
FROM contratantes_senhas 
WHERE senha_hash LIKE 'PLACEHOLDER_%'
"@

try {
    $placeholders = psql $env:DATABASE_URL -t -c $placeholdersQuery
    Write-Host "Placeholders encontrados: $placeholders" -ForegroundColor $(if ($placeholders -gt 0) { "Yellow" } else { "Green" })
} catch {
    Write-Host "⚠️  Não foi possível verificar placeholders: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Verificando status RLS atual..." -ForegroundColor White
$rlsQuery = @"
SELECT tablename, 
       CASE WHEN relforcerowsecurity THEN 'FORCE' ELSE 'NORMAL' END as rls_mode
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE schemaname = 'public'
AND tablename IN ('contratantes', 'funcionarios', 'avaliacoes')
ORDER BY tablename
"@

try {
    psql $env:DATABASE_URL -c $rlsQuery
} catch {
    Write-Host "⚠️  Não foi possível verificar RLS: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 FASE 3: Aplicando Migration 999" -ForegroundColor Cyan
Write-Host "-" * 60

$migrationFile = "database\migrations\999_correcoes_criticas_seguranca.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ ERRO: Arquivo de migration não encontrado: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Aplicando migration..." -ForegroundColor White

try {
    psql $env:DATABASE_URL -f $migrationFile
    Write-Host ""
    Write-Host "✓ Migration aplicada com sucesso!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ ERRO ao aplicar migration: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para reverter, restaure o backup:" -ForegroundColor Yellow
    Write-Host "  psql `$env:DATABASE_URL < $backupFile" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "📋 FASE 4: Verificação Pós-Migration" -ForegroundColor Cyan
Write-Host "-" * 60

Write-Host "Executando função de verificação de segurança..." -ForegroundColor White
Write-Host ""

try {
    psql $env:DATABASE_URL -c "SELECT * FROM verificar_seguranca_rls();"
    Write-Host ""
} catch {
    Write-Host "⚠️  Erro ao executar verificação: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 FASE 5: Verificações Específicas" -ForegroundColor Cyan
Write-Host "-" * 60

# 1. Verificar FORCE RLS
Write-Host "1. Verificando FORCE RLS..." -ForegroundColor White
$forceRlsQuery = @"
SELECT COUNT(*) as total
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE schemaname = 'public'
AND tablename IN ('contratantes', 'funcionarios', 'avaliacoes', 'laudos', 'contratos')
AND relforcerowsecurity = true
"@

$forceRlsCount = psql $env:DATABASE_URL -t -c $forceRlsQuery
Write-Host "   Tabelas com FORCE RLS: $forceRlsCount/5" -ForegroundColor $(if ($forceRlsCount -ge 5) { "Green" } else { "Red" })

# 2. Verificar índices RLS
Write-Host "2. Verificando índices RLS..." -ForegroundColor White
$indicesQuery = @"
SELECT COUNT(*) as total
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE '%_rls'
"@

$indicesCount = psql $env:DATABASE_URL -t -c $indicesQuery
Write-Host "   Índices RLS criados: $indicesCount" -ForegroundColor $(if ($indicesCount -ge 10) { "Green" } else { "Yellow" })

# 3. Verificar auditoria
Write-Host "3. Verificando sistema de auditoria..." -ForegroundColor White
$auditQuery = @"
SELECT COUNT(*) as total
FROM pg_event_trigger
WHERE evtname = 'trg_audit_policy_ddl'
"@

$auditCount = psql $env:DATABASE_URL -t -c $auditQuery
Write-Host "   Event trigger de auditoria: $auditCount" -ForegroundColor $(if ($auditCount -eq 1) { "Green" } else { "Red" })

# 4. Verificar funções de segurança
Write-Host "4. Verificando funções de segurança..." -ForegroundColor White
$funcoesQuery = @"
SELECT COUNT(*) as total
FROM pg_proc
WHERE proname IN ('validar_sessao_rls', 'verificar_seguranca_rls', 'prevenir_placeholder_senha')
"@

$funcoesCount = psql $env:DATABASE_URL -t -c $funcoesQuery
Write-Host "   Funções de segurança: $funcoesCount/3" -ForegroundColor $(if ($funcoesCount -eq 3) { "Green" } else { "Red" })

# 5. Verificar placeholders restantes
Write-Host "5. Verificando placeholders..." -ForegroundColor White
$placeholdersRestantes = psql $env:DATABASE_URL -t -c $placeholdersQuery
Write-Host "   Placeholders restantes: $placeholdersRestantes" -ForegroundColor $(if ($placeholdersRestantes -eq 0) { "Green" } else { "Red" })

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ CORREÇÕES CRÍTICAS DE SEGURANÇA APLICADAS" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Execute os testes de segurança:" -ForegroundColor White
Write-Host "   npm test correcoes-criticas-seguranca" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verifique logs da aplicação após deploy" -ForegroundColor White
Write-Host ""
Write-Host "3. Monitore a tabela de auditoria:" -ForegroundColor White
Write-Host "   SELECT * FROM rls_policy_audit ORDER BY event_time DESC LIMIT 10;" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Forçar reset de senhas marcadas:" -ForegroundColor White
Write-Host "   SELECT cpf FROM contratantes_senhas WHERE senha_hash LIKE 'RESET_REQUIRED_%';" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Leia a documentação completa:" -ForegroundColor White
Write-Host "   docs/CORRECOES-CRITICAS-SEGURANCA.md" -ForegroundColor Gray
Write-Host ""

Write-Host "💾 Backup salvo em: $backupFile" -ForegroundColor Cyan
Write-Host ""
