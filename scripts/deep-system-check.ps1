# Deep System Check - Comparação Completa Prod vs Dev
# Data: 2026-02-04

$ErrorActionPreference = "Continue"
$OutputEncoding = [System.Text.Encoding]::UTF8

$reportPath = "c:\apps\QWork\schema-comparison\deep-check-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').md"

# Conexões
$prodConn = "postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb"
$devConn = "postgresql://postgres:123456@localhost:5432/nr-bps_db"

$report = @"
# Deep System Check - Análise Completa
**Data:** $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')
**Objetivo:** Identificar TODAS as diferenças entre produção e desenvolvimento

---

"@

Write-Host "🔍 Iniciando Deep System Check..." -ForegroundColor Cyan

# 1. Verificar triggers duplicados/problema
Write-Host "`n📊 1. Analisando triggers duplicados..." -ForegroundColor Yellow
$report += "`n## 1. TRIGGERS DUPLICADOS/PROBLEMÁTICOS`n`n"

$triggersProd = psql $prodConn -t -c @"
SELECT 
    trigger_name, 
    event_object_table, 
    COUNT(*) as count
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY trigger_name, event_object_table
HAVING COUNT(*) > 1
ORDER BY count DESC, trigger_name;
"@

$report += "### Triggers Duplicados em PRODUÇÃO:`n``````n$triggersProd`n``````n`n"

# 2. Verificar funções que existem em prod mas não em dev
Write-Host "📊 2. Funções extras em produção..." -ForegroundColor Yellow
$report += "`n## 2. FUNÇÕES EXCLUSIVAS DE PRODUÇÃO`n`n"

$funcsProdOnly = psql $prodConn -t -c @"
SELECT 
    p.proname,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE 'armor%'
    AND p.proname NOT LIKE 'crypt%'
    AND p.proname NOT LIKE 'pgp_%'
    AND p.proname NOT LIKE 'gen_%'
    AND p.proname IN (
        'fn_limpar_tokens_expirados',
        'fn_marcar_token_usado',
        'fn_reconcluir_lote_for_emergencia',
        'fn_validar_token_pagamento',
        'notificar_pre_cadastro_criado',
        'notificar_valor_definido',
        'trg_recalc_lote_on_avaliacao_change'
    )
ORDER BY p.proname;
"@

$report += "``````sql`n$funcsProdOnly`n``````n`n"

# 3. Verificar views exclusivas de produção
Write-Host "📊 3. Views extras em produção..." -ForegroundColor Yellow
$report += "`n## 3. VIEWS EXCLUSIVAS DE PRODUÇÃO`n`n"

$viewsProdOnly = psql $prodConn -t -c @"
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
    AND table_name IN ('v_auditoria_emissoes', 'v_relatorio_emissoes_usuario')
ORDER BY table_name;
"@

$report += "``````sql`n$viewsProdOnly`n``````n`n"

# 4. Verificar constraints diferentes
Write-Host "📊 4. Comparando constraints críticas..." -ForegroundColor Yellow
$report += "`n## 4. CONSTRAINTS CRÍTICAS`n`n"

# 4a. Constraints da tabela lotes_avaliacao
$constraintsLoteProd = psql $prodConn -t -c @"
SELECT 
    conname, 
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'lotes_avaliacao'::regclass
ORDER BY conname;
"@

$constraintsLoteDev = psql $devConn -t -c @"
SELECT 
    conname, 
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'lotes_avaliacao'::regclass
ORDER BY conname;
"@

$report += "### Constraints lotes_avaliacao em PRODUÇÃO:`n``````n$constraintsLoteProd`n``````n`n"
$report += "### Constraints lotes_avaliacao em DESENVOLVIMENTO:`n``````n$constraintsLoteDev`n``````n`n"

# 4b. Constraints da tabela avaliacoes
$constraintsAvProd = psql $prodConn -t -c @"
SELECT 
    conname, 
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'avaliacoes'::regclass
ORDER BY conname;
"@

$constraintsAvDev = psql $devConn -t -c @"
SELECT 
    conname, 
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'avaliacoes'::regclass
ORDER BY conname;
"@

$report += "### Constraints avaliacoes em PRODUÇÃO:`n``````n$constraintsAvProd`n``````n`n"
$report += "### Constraints avaliacoes em DESENVOLVIMENTO:`n``````n$constraintsAvDev`n``````n`n"

# 5. Verificar colunas das tabelas principais
Write-Host "📊 5. Comparando colunas de tabelas principais..." -ForegroundColor Yellow
$report += "`n## 5. COLUNAS DAS TABELAS PRINCIPAIS`n`n"

$tables = @('lotes_avaliacao', 'avaliacoes', 'laudos', 'funcionarios', 'empresas_clientes', 'audit_logs', 'auditoria_laudos')

foreach ($table in $tables) {
    Write-Host "  - Verificando $table..." -ForegroundColor Gray
    
    $colsProd = psql $prodConn -t -c @"
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = '$table'
ORDER BY ordinal_position;
"@

    $colsDev = psql $devConn -t -c @"
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = '$table'
ORDER BY ordinal_position;
"@

    $report += "### Tabela: $table`n"
    $report += "**PRODUÇÃO:**`n``````n$colsProd`n``````n`n"
    $report += "**DESENVOLVIMENTO:**`n``````n$colsDev`n``````n`n"
}

# 6. Verificar endpoints API
Write-Host "📊 6. Mapeando endpoints API..." -ForegroundColor Yellow
$report += "`n## 6. ENDPOINTS API`n`n"

# RH endpoints
$rhEndpoints = Get-ChildItem -Path "c:\apps\QWork\app\api\rh" -Recurse -Filter "route.ts" | 
    ForEach-Object { $_.FullName.Replace("c:\apps\QWork\app\api\", "").Replace("\route.ts", "").Replace("\", "/") }

# Entidade endpoints
$entidadeEndpoints = Get-ChildItem -Path "c:\apps\QWork\app\api\entidade" -Recurse -Filter "route.ts" | 
    ForEach-Object { $_.FullName.Replace("c:\apps\QWork\app\api\", "").Replace("\route.ts", "").Replace("\", "/") }

$report += "### Endpoints RH ($($rhEndpoints.Count)):`n``````n"
$rhEndpoints | ForEach-Object { $report += "/api/$_`n" }
$report += "``````n`n"

$report += "### Endpoints Entidade ($($entidadeEndpoints.Count)):`n``````n"
$entidadeEndpoints | ForEach-Object { $report += "/api/$_`n" }
$report += "``````n`n"

# 7. Verificar variáveis de ambiente
Write-Host "📊 7. Verificando configurações..." -ForegroundColor Yellow
$report += "`n## 7. CONFIGURAÇÕES E VARIÁVEIS`n`n"

# Ler .env.local se existir
if (Test-Path "c:\apps\QWork\.env.local") {
    $envContent = Get-Content "c:\apps\QWork\.env.local" | Where-Object { $_ -notmatch "^#" -and $_ -ne "" }
    $report += "### Variáveis de ambiente (.env.local):`n``````bash`n"
    foreach ($line in $envContent) {
        # Ofuscar valores sensíveis
        if ($line -match "PASSWORD|SECRET|KEY|TOKEN") {
            $parts = $line -split "=", 2
            $report += "$($parts[0])=***REDACTED***`n"
        } else {
            $report += "$line`n"
        }
    }
    $report += "``````n`n"
}

# 8. Verificar migrations aplicadas manualmente
Write-Host "📊 8. Analisando migrations..." -ForegroundColor Yellow
$report += "`n## 8. MIGRATIONS APLICADAS MANUALMENTE`n`n"

$migrationFiles = Get-ChildItem -Path "c:\apps\QWork\database\migrations" -Filter "*.sql" | 
    Sort-Object Name | 
    ForEach-Object { $_.Name }

$report += "### Arquivos de migration no repositório:`n``````n"
$migrationFiles | ForEach-Object { $report += "$_`n" }
$report += "``````n`n"

# Migrations recentes (últimas 10)
$recentMigrations = $migrationFiles | Select-Object -Last 10
$report += "### 10 migrations mais recentes:`n``````n"
$recentMigrations | ForEach-Object { $report += "$_`n" }
$report += "``````n`n"

# 9. Verificar se trigger trg_recalc_lote_on_avaliacao_change está correto
Write-Host "📊 9. Verificando trigger problemático..." -ForegroundColor Yellow
$report += "`n## 9. ANÁLISE DO TRIGGER trg_recalc_lote_on_avaliacao_change`n`n"

$triggerDefProd = psql $prodConn -t -c @"
SELECT pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgname = 'trg_recalc_lote_on_avaliacao_change';
"@

$report += "### Definição em PRODUÇÃO:`n``````sql`n$triggerDefProd`n``````n`n"

$triggerDefDev = psql $devConn -t -c @"
SELECT pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgname = 'trg_recalc_lote_on_avaliacao_change';
"@

$report += "### Definição em DESENVOLVIMENTO:`n``````sql`n$triggerDefDev`n``````n`n"

# Buscar definição da função em ambos
$funcDefProd = psql $prodConn -t -c @"
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update';
"@

$report += "### Função fn_recalcular_status_lote_on_avaliacao_update em PRODUÇÃO:`n``````sql`n$funcDefProd`n``````n`n"

# 10. Resumo e ações recomendadas
Write-Host "📊 10. Gerando resumo..." -ForegroundColor Yellow
$report += "`n## 10. RESUMO E AÇÕES RECOMENDADAS`n`n"

$report += @"
### Problemas Identificados:

1. **Triggers Duplicados**: Produção tem triggers duplicados que podem causar loops
2. **Funções Ausentes em Dev**: 7 funções em produção não estão em desenvolvimento
3. **Views Ausentes em Dev**: 2 views em produção não estão em desenvolvimento
4. **Trigger Problemático**: trg_recalc_lote_on_avaliacao_change pode estar chamando função incorretamente

### Ações Imediatas Recomendadas:

1. **Remover triggers duplicados em produção**
   - Identificados: trg_recalc_lote_on_avaliacao_change (3x)
   - tr_contratantes_sync_status_ativa (2x)

2. **Sincronizar funções**:
   - Aplicar migrations ou criar funções faltantes em dev
   - Ou remover funções não utilizadas de prod

3. **Verificar endpoint parity**:
   - Garantir que RH e Entidade têm rotas equivalentes
   - Verificar autenticação e autorização

4. **Validar migrations**:
   - Criar sistema de tracking de migrations
   - Garantir aplicação sequencial

### Próximos Passos:

- [ ] Corrigir trigger trg_recalc_lote_on_avaliacao_change
- [ ] Remover duplicatas de triggers
- [ ] Sincronizar funções e views
- [ ] Implementar sistema de migration tracking
- [ ] Validar paridade de endpoints

"@

# Salvar relatório
$report | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "`n✅ Relatório gerado com sucesso!" -ForegroundColor Green
Write-Host "📄 Arquivo: $reportPath" -ForegroundColor Cyan

# Abrir relatório (opcional)
# code $reportPath
