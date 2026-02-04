-- Script de Diagnóstico Completo: Avaliações e Lotes
-- Data: 04/02/2026
-- Propósito: Verificar estado do sistema antes/depois das migrations 300 e 301

\echo '=================================================='
\echo '=== DIAGNÓSTICO: AVALIAÇÕES E LOTES ============='
\echo '=================================================='
\echo ''

-- ==========================================
-- 1. VERIFICAR AVALIAÇÕES COM 37+ RESPOSTAS
-- ==========================================
\echo '=== 1. AVALIAÇÕES COM 37+ RESPOSTAS ==='
\echo ''

SELECT 
    a.id,
    a.funcionario_cpf,
    a.lote_id,
    a.status,
    a.inicio,
    a.envio as data_conclusao,
    COUNT(DISTINCT (r.grupo, r.item)) as total_respostas,
    CASE 
        WHEN a.status = 'concluida' AND COUNT(DISTINCT (r.grupo, r.item)) >= 37 
        THEN '✅ CORRETO'
        WHEN a.status != 'concluida' AND COUNT(DISTINCT (r.grupo, r.item)) >= 37 
        THEN '❌ ERRO: Deveria estar concluída'
        WHEN a.status = 'concluida' AND COUNT(DISTINCT (r.grupo, r.item)) < 37 
        THEN '❌ ERRO: Marcada como concluída sem 37 respostas'
        ELSE '⏸️ EM ANDAMENTO'
    END as validacao
FROM avaliacoes a
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.lote_id IS NOT NULL
GROUP BY a.id, a.funcionario_cpf, a.lote_id, a.status, a.inicio, a.envio
HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 30 -- Mostrar avaliações próximas de concluir
ORDER BY total_respostas DESC, a.id;

\echo ''

-- ==========================================
-- 2. ESTATÍSTICAS DE AVALIAÇÕES POR STATUS
-- ==========================================
\echo '=== 2. ESTATÍSTICAS POR STATUS ==='
\echo ''

WITH avaliacao_stats AS (
    SELECT 
        a.id,
        a.status,
        COUNT(DISTINCT (r.grupo, r.item)) as total_respostas
    FROM avaliacoes a
    LEFT JOIN respostas r ON r.avaliacao_id = a.id
    WHERE a.lote_id IS NOT NULL
    GROUP BY a.id, a.status
)
SELECT 
    status,
    COUNT(*) as quantidade,
    COUNT(*) FILTER (WHERE total_respostas >= 37) as com_37_respostas,
    COUNT(*) FILTER (WHERE total_respostas < 37) as incompletas,
    ROUND(AVG(total_respostas), 2) as media_respostas
FROM avaliacao_stats
GROUP BY status
ORDER BY quantidade DESC;

\echo ''

-- ==========================================
-- 3. VERIFICAR LOTE_ID_ALLOCATOR
-- ==========================================
\echo '=== 3. ESTADO DO lote_id_allocator ==='
\echo ''

SELECT 
    'Allocator atual' as tipo,
    last_id as valor,
    (SELECT MAX(id) FROM lotes_avaliacao) as max_id_lotes,
    (SELECT MAX(id) FROM lotes_avaliacao) - last_id as diferenca,
    CASE 
        WHEN last_id >= (SELECT COALESCE(MAX(id), 0) FROM lotes_avaliacao) 
        THEN '✅ SINCRONIZADO'
        ELSE '❌ DESATUALIZADO'
    END as status
FROM lote_id_allocator;

\echo ''

-- ==========================================
-- 4. LOTES COM POSSÍVEIS PROBLEMAS
-- ==========================================
\echo '=== 4. LOTES RECENTES E ESTADO ==='
\echo ''

SELECT 
    l.id,
    l.codigo,
    l.status as status_lote,
    l.criado_em,
    COUNT(a.id) as total_avaliacoes,
    COUNT(a.id) FILTER (WHERE a.status = 'concluida') as concluidas,
    COUNT(a.id) FILTER (WHERE a.status IN ('iniciada', 'em_andamento')) as em_andamento,
    COUNT(a.id) FILTER (WHERE a.status = 'inativada') as inativadas,
    CASE 
        WHEN l.status = 'concluido' AND COUNT(a.id) FILTER (WHERE a.status = 'concluida') = COUNT(a.id)
        THEN '✅ CORRETO'
        WHEN l.status = 'ativo' AND COUNT(a.id) FILTER (WHERE a.status = 'concluida') = COUNT(a.id)
        THEN '⚠️ Deveria estar concluído'
        ELSE '⏸️ EM ANDAMENTO'
    END as validacao
FROM lotes_avaliacao l
LEFT JOIN avaliacoes a ON a.lote_id = l.id
WHERE l.criado_em >= NOW() - INTERVAL '30 days'
GROUP BY l.id, l.codigo, l.status, l.criado_em
ORDER BY l.id DESC
LIMIT 20;

\echo ''

-- ==========================================
-- 5. VERIFICAR IDS DUPLICADOS OU GAPS
-- ==========================================
\echo '=== 5. VERIFICAR INTEGRIDADE DE IDs ==='
\echo ''

-- Verificar se há IDs duplicados em lotes
SELECT 
    '❌ LOTES COM IDs DUPLICADOS' as problema,
    id,
    COUNT(*) as ocorrencias
FROM lotes_avaliacao
GROUP BY id
HAVING COUNT(*) > 1;

-- Se não houver duplicados, mostrar mensagem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM lotes_avaliacao 
        GROUP BY id 
        HAVING COUNT(*) > 1
    ) THEN
        RAISE NOTICE '✅ Nenhum ID duplicado encontrado em lotes_avaliacao';
    END IF;
END $$;

\echo ''

-- Verificar gaps (IDs faltantes)
SELECT 
    '⚠️ GAPS em IDs de lotes (pode ser normal)' as observacao,
    s.id as id_faltante
FROM generate_series(
    (SELECT MIN(id) FROM lotes_avaliacao),
    (SELECT MAX(id) FROM lotes_avaliacao)
) AS s(id)
WHERE NOT EXISTS (SELECT 1 FROM lotes_avaliacao WHERE id = s.id)
ORDER BY id_faltante
LIMIT 10;

\echo ''

-- ==========================================
-- 6. VERIFICAR FUNÇÕES E TRIGGERS
-- ==========================================
\echo '=== 6. FUNÇÕES E TRIGGERS ==='
\echo ''

-- Verificar se funções existem
SELECT 
    'Funções críticas' as tipo,
    proname as nome_funcao,
    CASE 
        WHEN proname IN ('fn_next_lote_id', 'fn_validar_status_avaliacao', 'resincronizar_lote_id_allocator')
        THEN '✅ PRESENTE'
        ELSE '⏸️ OUTRAS'
    END as status
FROM pg_proc
WHERE proname IN (
    'fn_next_lote_id', 
    'fn_validar_status_avaliacao', 
    'resincronizar_lote_id_allocator',
    'fn_reservar_id_laudo_on_lote_insert'
)
ORDER BY proname;

\echo ''

-- Verificar triggers
SELECT 
    'Triggers críticos' as tipo,
    tgname as nome_trigger,
    tgrelid::regclass as tabela,
    '✅ PRESENTE' as status
FROM pg_trigger
WHERE tgname IN (
    'trg_validar_status_avaliacao',
    'trg_lote_id_allocator_single_row',
    'trg_reservar_id_laudo_on_lote_insert'
)
ORDER BY tgname;

\echo ''

-- ==========================================
-- 7. RESUMO EXECUTIVO
-- ==========================================
\echo '=== 7. RESUMO EXECUTIVO ==='
\echo ''

WITH 
avaliacoes_problematicas AS (
    SELECT COUNT(*) as qtd
    FROM avaliacoes a
    JOIN respostas r ON r.avaliacao_id = a.id
    WHERE a.status != 'concluida'
    GROUP BY a.id
    HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
),
lotes_problematicos AS (
    SELECT COUNT(*) as qtd
    FROM lotes_avaliacao l
    JOIN avaliacoes a ON a.lote_id = l.id
    WHERE l.status = 'ativo'
    GROUP BY l.id
    HAVING COUNT(a.id) FILTER (WHERE a.status = 'concluida') = COUNT(a.id)
    AND COUNT(a.id) > 0
)
SELECT 
    'Resumo do Sistema' as titulo,
    (SELECT COUNT(*) FROM avaliacoes WHERE status = 'concluida') as avaliacoes_concluidas,
    (SELECT COUNT(*) FROM avaliacoes WHERE status IN ('iniciada', 'em_andamento')) as avaliacoes_em_andamento,
    (SELECT COALESCE(SUM(qtd), 0) FROM avaliacoes_problematicas) as avaliacoes_com_erro,
    (SELECT COUNT(*) FROM lotes_avaliacao WHERE status = 'concluido') as lotes_concluidos,
    (SELECT COUNT(*) FROM lotes_avaliacao WHERE status = 'ativo') as lotes_ativos,
    (SELECT COALESCE(SUM(qtd), 0) FROM lotes_problematicos) as lotes_com_erro,
    (SELECT last_id FROM lote_id_allocator) as allocator_atual,
    (SELECT MAX(id) FROM lotes_avaliacao) as max_lote_id;

\echo ''
\echo '=================================================='
\echo '=== FIM DO DIAGNÓSTICO =========================='
\echo '=================================================='
\echo ''
\echo 'Para aplicar correções, execute as migrations:'
\echo '1. 300_fix_conclusao_automatica_avaliacao.sql'
\echo '2. 301_fix_lote_id_allocator_collision.sql'
\echo ''
