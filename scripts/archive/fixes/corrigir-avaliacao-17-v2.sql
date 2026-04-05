-- Script de Correção: Avaliação #17 do Lote 21 (v2)
-- Data: 04/02/2026
-- Problema: Status não foi atualizado para 'concluida' apesar de ter 37 respostas

BEGIN;

-- Atualizar status e timestamp de conclusão
UPDATE avaliacoes 
SET 
    status = 'concluida',
    envio = '2026-02-04 15:52:20'::timestamp,
    atualizado_em = NOW()
WHERE id = 17;

-- Verificar se foi aplicado
SELECT 
    id,
    funcionario_cpf,
    status,
    envio,
    inicio,
    atualizado_em,
    '✅ CORRIGIDO' as observacao
FROM avaliacoes
WHERE id = 17;

COMMIT;

-- Verificação final
\echo ''
\echo '=== VERIFICAÇÃO FINAL ==='
SELECT 
    a.id,
    a.status,
    a.envio as data_conclusao,
    COUNT(DISTINCT r.id) as total_respostas,
    COUNT(DISTINCT res.id) as total_resultados
FROM avaliacoes a
LEFT JOIN respostas r ON r.avaliacao_id = a.id
LEFT JOIN resultados res ON res.avaliacao_id = a.id
WHERE a.id = 17
GROUP BY a.id, a.status, a.envio;

\echo ''
\echo '=== VIEW ATUALIZADA ==='
SELECT 
    cpf,
    nome,
    avaliacao_id,
    status_avaliacao,
    data_conclusao,
    data_inicio
FROM vw_funcionarios_por_lote
WHERE lote_id = 21 AND avaliacao_id = 17;
