-- Script de Correção SISTÊMICA para Banco NEON
-- Corrige TODAS as avaliações com 37+ respostas e recalcula TODOS os lotes

BEGIN;

-- Configurar contexto de usuário para os triggers de auditoria
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';

-- ====================================================================================
-- IDENTIFICAR AVALIAÇÕES PROBLEMÁTICAS (TODAS)
-- ====================================================================================

\echo '=== IDENTIFICANDO TODAS AS AVALIAÇÕES COM 37+ RESPOSTAS NÃO CONCLUÍDAS ==='

CREATE TEMP TABLE avaliacoes_para_corrigir AS
SELECT 
    a.id,
    a.lote_id,
    a.funcionario_cpf,
    a.status,
    COUNT(DISTINCT (r.grupo, r.item)) as respostas_unicasas lote_codigo,
    la.tipo as lote_tipo
FROM avaliacoes a
JOIN lotes_avaliacao la ON la.id = a.lote_id
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.status NOT IN ('concluida', 'inativada')
GROUP BY a.id, a.lote_id, a.funcionario_cpf, a.status,  la.tipo
HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37;

SELECT 
    COUNT(*) as total_avaliacoes_para_corrigir,
    STRING_AGG(id::text, ', ' ORDER BY id) as ids
FROM avaliacoes_para_corrigir;

\echo ''
SELECT * FROM avaliacoes_para_corrigir ORDER BY id;

-- ====================================================================================
-- CORRIGIR TODAS AS AVALIAÇÕES
-- ====================================================================================

\echo ''
\echo '=== CORRIGINDO TODAS AS AVALIAÇÕES (marcando como concluídas) ==='

UPDATE avaliacoes a
SET 
    status = 'concluida',
    envio = COALESCE(envio, NOW()),
    atualizado_em = NOW()
FROM avaliacoes_para_corrigir apc
WHERE a.id = apc.id
RETURNING a.id, a.lote_id, a.funcionario_cpf, a.status, a.envio;

-- ====================================================================================
-- RECALCULAR STATUS DOS LOTES AFETADOS
-- ====================================================================================

\echo ''
\echo '=== IDENTIFICANDO LOTES QUE DEVEM ESTAR CONCLUÍDOS ==='

CREATE TEMP TABLE lotes_para_atualizar AS
SELECT 
    la.id,
    
    la.status as status_atual,
    la.tipo,
    COUNT(a.id) as total_avaliacoes,
    COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
    COUNT(CASE WHEN a.status IN ('iniciada', 'em_andamento') THEN 1 END) as pendentes
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON a.lote_id = la.id
WHERE la.status IN ('ativo', 'em_andamento', 'rascunho')
  AND a.status NOT IN ('inativada')
GROUP BY la.id,  la.status, la.tipo
HAVING COUNT(a.id) > 0 
   AND COUNT(CASE WHEN a.status IN ('iniciada', 'em_andamento') THEN 1 END) = 0;

SELECT 
    COUNT(*) as total_lotes_para_atualizar,
    STRING_AGG(id::text || ' (' || codigo || ')', ', ' ORDER BY id) as lotes
FROM lotes_para_atualizar;

\echo ''
SELECT * FROM lotes_para_atualizar ORDER BY id;

\echo ''
\echo '=== ATUALIZANDO TODOS OS LOTES PARA CONCLUÍDO ==='

UPDATE lotes_avaliacao la
SET 
    status = 'concluido',
    atualizado_em = NOW()
FROM lotes_para_atualizar lpa
WHERE la.id = lpa.id
RETURNING la.id,  la.status, la.tipo;

-- ====================================================================================
-- VERIFICAÇÃO FINAL
-- ====================================================================================

\echo ''
\echo '=== VERIFICAÇÃO: Ainda há avaliações com 37+ respostas não concluídas? ==='

SELECT 
    COUNT(*) as avaliacoes_problematicas,
    STRING_AGG(a.id::text, ', ' ORDER BY a.id) as ids
FROM (
    SELECT a.id
    FROM avaliacoes a
    LEFT JOIN respostas r ON r.avaliacao_id = a.id
    WHERE a.status NOT IN ('concluida', 'inativada')
    GROUP BY a.id
    HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
) subq;

\echo ''
\echo '=== VERIFICAÇÃO: Lotes que ainda deveriam estar concluídos ==='

SELECT 
    la.id,
    
    la.status,
    la.tipo,
    COUNT(a.id) as total_avaliacoes,
    COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
    COUNT(CASE WHEN a.status IN ('iniciada', 'em_andamento') THEN 1 END) as pendentes
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON a.lote_id = la.id
WHERE la.status != 'concluido'
  AND a.status NOT IN ('inativada')
GROUP BY la.id
HAVING COUNT(a.id) > 0 
   AND COUNT(CASE WHEN a.status IN ('iniciada', 'em_andamento') THEN 1 END) = 0;

\echo ''
\echo '=== CORREÇÃO SISTÊMICA CONCLUÍDA! ==='
\echo 'Todas as avaliações com 37+ respostas foram marcadas como concluídas'
\echo 'Todos os lotes sem avaliações pendentes foram marcados como concluídos'

COMMIT;
