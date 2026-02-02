-- ================================================================
-- VERIFICAÇÃO DE MIGRATIONS NO NEON (PRODUÇÃO)
-- ================================================================
-- Uso: psql $env:DATABASE_URL -f scripts/verify-neon-migrations.sql

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ' VERIFICAÇÃO DE MIGRATIONS - NEON (PRODUÇÃO)                    '
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ================================================================
-- 1. ESTATÍSTICAS GERAIS
-- ================================================================

\echo '1. ESTATÍSTICAS GERAIS'
\echo '──────────────────────────────────────────────────────────────────'
\echo ''

SELECT 
    COUNT(*) as total_migrations,
    MIN(applied_at) as primeira_migration,
    MAX(applied_at) as ultima_migration
FROM _prisma_migrations;

\echo ''

-- ================================================================
-- 2. ÚLTIMAS 20 MIGRATIONS APLICADAS
-- ================================================================

\echo '2. ÚLTIMAS 20 MIGRATIONS APLICADAS'
\echo '──────────────────────────────────────────────────────────────────'
\echo ''

SELECT 
    migration_name,
    applied_at,
    CASE 
        WHEN applied_at > NOW() - INTERVAL '1 day' THEN '🔥 Hoje'
        WHEN applied_at > NOW() - INTERVAL '7 days' THEN '📅 Esta semana'
        WHEN applied_at > NOW() - INTERVAL '30 days' THEN '📆 Este mês'
        ELSE '📜 Anterior'
    END as periodo
FROM _prisma_migrations
ORDER BY migration_name DESC
LIMIT 20;

\echo ''

-- ================================================================
-- 3. MIGRATIONS CRÍTICAS (REMOÇÃO DE AUTOMAÇÃO)
-- ================================================================

\echo '3. MIGRATIONS CRÍTICAS (Remoção de Automação)'
\echo '──────────────────────────────────────────────────────────────────'
\echo ''

\echo '  Verificando migration 150 (remove auto_emission_trigger)...'
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM _prisma_migrations 
            WHERE migration_name LIKE '%150_remove%' 
               OR migration_name LIKE '%150%auto%emission%'
        ) THEN '✅ APLICADA'
        ELSE '❌ NÃO APLICADA'
    END as status_150;

\echo ''
\echo '  Verificando migration 151 (remove auto_laudo_creation_trigger)...'
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM _prisma_migrations 
            WHERE migration_name LIKE '%151_remove%' 
               OR migration_name LIKE '%151%auto%laudo%'
        ) THEN '✅ APLICADA'
        ELSE '❌ NÃO APLICADA'
    END as status_151;

\echo ''

-- ================================================================
-- 4. VERIFICAR TRIGGERS DE AUTOMAÇÃO (DEVEM ESTAR REMOVIDOS)
-- ================================================================

\echo '4. TRIGGERS DE AUTOMAÇÃO (Devem estar removidos)'
\echo '──────────────────────────────────────────────────────────────────'
\echo ''

\echo '  Trigger: fn_reservar_id_laudo_on_lote_insert (deve NÃO existir)...'
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'fn_reservar_id_laudo_on_lote_insert'
        ) THEN '❌ AINDA EXISTE (migration 151 não aplicada!)'
        ELSE '✅ REMOVIDO CORRETAMENTE'
    END as status_trigger_151;

\echo ''

-- ================================================================
-- 5. VERIFICAR FUNÇÃO DE RECÁLCULO (NÃO DEVE INSERIR EM FILA)
-- ================================================================

\echo '5. FUNÇÃO DE RECÁLCULO (Não deve inserir em fila_emissao)'
\echo '──────────────────────────────────────────────────────────────────'
\echo ''

SELECT 
    routine_name,
    CASE 
        WHEN routine_definition LIKE '%INSERT INTO fila_emissao%' THEN '❌ AINDA INSERE EM FILA!'
        WHEN routine_definition LIKE '%fila_emissao%' THEN '⚠️ MENCIONA fila_emissao'
        ELSE '✅ NÃO INSERE EM FILA'
    END as status_insercao_fila
FROM information_schema.routines
WHERE routine_name = 'fn_recalcular_status_lote_on_avaliacao_update';

\echo ''

-- ================================================================
-- 6. VERIFICAR TRIGGERS ATIVOS
-- ================================================================

\echo '6. TRIGGERS ATIVOS NO SISTEMA'
\echo '──────────────────────────────────────────────────────────────────'
\echo ''

SELECT 
    trigger_name,
    event_object_table as tabela,
    event_manipulation as evento,
    action_statement as funcao
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

\echo ''

-- ================================================================
-- 7. VERIFICAR TABELAS PRINCIPAIS
-- ================================================================

\echo '7. TABELAS PRINCIPAIS (Verificação de Integridade)'
\echo '──────────────────────────────────────────────────────────────────'
\echo ''

SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as num_colunas,
    (SELECT pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass))) as tamanho
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'avaliacoes',
    'lotes_avaliacao',
    'laudos',
    'fila_emissao',
    'funcionarios',
    'clinicas',
    'contratantes'
  )
ORDER BY table_name;

\echo ''

-- ================================================================
-- 8. VERIFICAR FILA DE EMISSÃO (ESTADO ATUAL)
-- ================================================================

\echo '8. FILA DE EMISSÃO (Estado Atual)'
\echo '──────────────────────────────────────────────────────────────────'
\echo ''

\echo '  Total de registros na fila_emissao:'
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE processado = true) as processados,
    COUNT(*) FILTER (WHERE processado = false) as pendentes,
    COUNT(*) FILTER (WHERE tipo_solicitante = 'rh') as solicitacoes_rh,
    COUNT(*) FILTER (WHERE tipo_solicitante = 'gestor_entidade') as solicitacoes_entidade,
    COUNT(*) FILTER (WHERE tipo_solicitante IS NULL) as sem_tipo
FROM fila_emissao;

\echo ''

-- ================================================================
-- 9. VERIFICAR LAUDOS EMITIDOS
-- ================================================================

\echo '9. LAUDOS EMITIDOS (Estado Atual)'
\echo '──────────────────────────────────────────────────────────────────'
\echo ''

SELECT 
    COUNT(*) as total_laudos,
    COUNT(*) FILTER (WHERE status = 'emitido') as emitidos,
    COUNT(*) FILTER (WHERE status = 'rascunho') as rascunhos,
    COUNT(*) FILTER (WHERE emissor_cpf IS NULL) as sem_emissor,
    COUNT(*) FILTER (WHERE url IS NULL) as sem_url,
    COUNT(*) FILTER (WHERE hash_pdf IS NULL) as sem_hash
FROM laudos;

\echo ''

-- ================================================================
-- 10. DETALHES DE LAUDOS PROBLEMÁTICOS
-- ================================================================

\echo '10. LAUDOS PROBLEMÁTICOS (Devem ser 0)'
\echo '──────────────────────────────────────────────────────────────────'
\echo ''

\echo '  Laudos em rascunho SEM emissor (criados automaticamente - ERRO!):'
SELECT COUNT(*) FROM laudos 
WHERE status = 'rascunho' 
  AND emissor_cpf IS NULL 
  AND hash_pdf IS NULL;

\echo ''
\echo '  Se > 0, executar limpeza:'
\echo '  DELETE FROM laudos WHERE status = ''rascunho'' AND emissor_cpf IS NULL AND hash_pdf IS NULL;'
\echo ''

-- ================================================================
-- 11. VERIFICAR INCONSISTÊNCIAS
-- ================================================================

\echo '11. VERIFICAÇÃO DE INCONSISTÊNCIAS'
\echo '──────────────────────────────────────────────────────────────────'
\echo ''

\echo '  Lotes concluídos SEM laudo emitido:'
SELECT COUNT(*) FROM lotes_avaliacao la
WHERE la.status = 'concluido'
  AND NOT EXISTS (SELECT 1 FROM laudos l WHERE l.lote_id = la.id AND l.status = 'emitido');

\echo ''

\echo '  Laudos emitidos SEM URL de Backblaze:'
SELECT COUNT(*) FROM laudos
WHERE status = 'emitido' AND url IS NULL;

\echo ''

-- ================================================================
-- 12. RESUMO FINAL
-- ================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ' RESUMO FINAL                                                    '
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

SELECT 
    'Total de Migrations' as item,
    COUNT(*)::text as valor
FROM _prisma_migrations
UNION ALL
SELECT 
    'Migration 150 Aplicada',
    CASE WHEN EXISTS (SELECT 1 FROM _prisma_migrations WHERE migration_name LIKE '%150%') THEN '✅ Sim' ELSE '❌ Não' END
UNION ALL
SELECT 
    'Migration 151 Aplicada',
    CASE WHEN EXISTS (SELECT 1 FROM _prisma_migrations WHERE migration_name LIKE '%151%') THEN '✅ Sim' ELSE '❌ Não' END
UNION ALL
SELECT 
    'Trigger Automático Removido',
    CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'fn_reservar_id_laudo_on_lote_insert') THEN '✅ Sim' ELSE '❌ Não' END
UNION ALL
SELECT 
    'Laudos Rascunho Órfãos',
    COUNT(*)::text
FROM laudos WHERE status = 'rascunho' AND emissor_cpf IS NULL
UNION ALL
SELECT 
    'Lotes Pendentes de Emissão',
    COUNT(*)::text
FROM fila_emissao WHERE processado = false;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo 'Verificação concluída!'
\echo ''
\echo 'Próximos passos:'
\echo '  1. Analisar resultados acima'
\echo '  2. Se migrations 150/151 NÃO aplicadas:'
\echo '     psql $env:DATABASE_URL -f database/migrations/150_remove_auto_emission_trigger.sql'
\echo '     psql $env:DATABASE_URL -f database/migrations/151_remove_auto_laudo_creation_trigger.sql'
\echo '  3. Executar novamente este script para validar'
\echo ''
