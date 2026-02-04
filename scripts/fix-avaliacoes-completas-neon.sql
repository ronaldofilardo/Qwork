-- Script de Correção para Banco NEON (nome de tabelas legadas)
-- Tabelas: respostas (não respostas_avaliacao), sem tabela notificacoes

-- ====================================================================================
-- PASSO 1: IDENTIFICAR AVALIAÇÕES PROBLEMÁTICAS
-- ====================================================================================

\echo '=== IDENTIFICANDO AVALIAÇÕES COM 37+ RESPOSTAS NÃO CONCLUÍDAS ==='

SELECT 
    a.id,
    a.lote_id,
    a.funcionario_cpf,
    a.status,
    a.inicio,
    a.envio,
    COUNT(DISTINCT (r.grupo, r.item)) as respostas_unicasas lote_codigo,
    la.tipo as lote_tipo,
    la.status as lote_status
FROM avaliacoes a
JOIN lotes_avaliacao la ON la.id = a.lote_id
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.status != 'concluida'
  AND a.status != 'inativada'
GROUP BY a.id, a.lote_id, a.funcionario_cpf, a.status, a.inicio, a.envio,  la.tipo, la.status
HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
ORDER BY a.id;

-- ====================================================================================
-- PASSO 2: CORRIGIR AVALIAÇÕES COM 37+ RESPOSTAS
-- ====================================================================================

\echo ''
\echo '=== CORRIGINDO AVALIAÇÕES (marcando como concluída) ==='

UPDATE avaliacoes a
SET 
    status = 'concluida',
    envio = COALESCE(envio, NOW()),
    atualizado_em = NOW()
WHERE a.id IN (
    SELECT av.id 
    FROM avaliacoes av
    LEFT JOIN respostas r ON r.avaliacao_id = av.id
    WHERE av.status != 'concluida'
      AND av.status != 'inativada'
    GROUP BY av.id
    HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
)
RETURNING id, lote_id, funcionario_cpf, status, envio;

-- ====================================================================================
-- PASSO 3: RECALCULAR STATUS DOS LOTES AFETADOS
-- ====================================================================================

\echo ''
\echo '=== IDENTIFICANDO LOTES QUE DEVEM ESTAR CONCLUÍDOS ==='

SELECT 
    la.id,
    
    la.status as status_atual,
    COUNT(a.id) as total_avaliacoes,
    COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON a.lote_id = la.id
WHERE la.status IN ('ativo', 'em_andamento')
GROUP BY la.id,  la.status
HAVING COUNT(a.id) > 0 
   AND COUNT(a.id) = COUNT(CASE WHEN a.status = 'concluida' THEN 1 END);

\echo ''
\echo '=== ATUALIZANDO STATUS DOS LOTES PARA CONCLUÍDO ==='

UPDATE lotes_avaliacao la
SET 
    status = 'concluido',
    atualizado_em = NOW()
WHERE la.id IN (
    SELECT lote_id
    FROM (
        SELECT 
            la2.id as lote_id,
            COUNT(a.id) as total_avaliacoes,
            COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas
        FROM lotes_avaliacao la2
        LEFT JOIN avaliacoes a ON a.lote_id = la2.id
        WHERE la2.status IN ('ativo', 'em_andamento')
        GROUP BY la2.id
        HAVING COUNT(a.id) > 0 
           AND COUNT(a.id) = COUNT(CASE WHEN a.status = 'concluida' THEN 1 END)
    ) subq
)
RETURNING id, codigo, status, tipo;

-- ====================================================================================
-- PASSO 4: VERIFICAÇÃO FINAL
-- ====================================================================================

\echo ''
\echo '=== VERIFICAÇÃO: Avaliações com 37+ respostas ainda não concluídas ==='

SELECT 
    COUNT(*) as avaliacoes_problematicas
FROM (
    SELECT a.id
    FROM avaliacoes a
    LEFT JOIN respostas r ON r.avaliacao_id = a.id
    WHERE a.status != 'concluida'
      AND a.status != 'inativada'
    GROUP BY a.id
    HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
) subq;

\echo ''
\echo '=== VERIFICAÇÃO: Lotes que deveriam estar concluídos ==='

SELECT 
    la.id,
    
    la.status,
    la.tipo,
    COUNT(a.id) as total_avaliacoes,
    COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON a.lote_id = la.id
WHERE la.status != 'concluido'
GROUP BY la.id
HAVING COUNT(a.id) > 0 AND COUNT(a.id) = COUNT(CASE WHEN a.status = 'concluida' THEN 1 END);

\echo ''
\echo '=== CORREÇÃO CONCLUÍDA! ==='
\echo 'NOTA: Notificações não foram criadas (tabela notificacoes não existe no Neon)'
\echo 'As notificações serão geradas automaticamente quando novos lotes forem concluídos'
