-- Script de Correção: Avaliação #17 do Lote 21
-- Data: 04/02/2026
-- Problema: Status não foi atualizado para 'concluida' apesar de ter 37 respostas

-- ==========================================
-- DIAGNÓSTICO CONFIRMADO
-- ==========================================
-- ✅ 37 respostas únicas salvas
-- ❌ Status = 'iniciada' (deveria ser 'concluida')
-- ❌ Campo 'envio' = NULL (deveria ter timestamp)
-- 📄 Interface mostra "Recibo de Conclusão" mas banco não reflete

-- ==========================================
-- CORREÇÃO DO STATUS
-- ==========================================
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
    atualizado_em
FROM avaliacoes
WHERE id = 17;

-- ==========================================
-- RECALCULAR RESULTADOS (SE NECESSÁRIO)
-- ==========================================
-- Verificar se resultados já foram calculados
SELECT 
    COUNT(*) as total_resultados
FROM resultados
WHERE avaliacao_id = 17;

-- Se retornar 0, os resultados precisam ser calculados manualmente
-- (isso deve ser feito pela aplicação, não por SQL direto)

-- ==========================================
-- VERIFICAR VIEW ATUALIZADA
-- ==========================================
SELECT 
    cpf,
    nome,
    avaliacao_id,
    status_avaliacao,
    data_conclusao,
    data_inicio
FROM vw_funcionarios_por_lote
WHERE lote_id = 21 AND avaliacao_id = 17;

-- ==========================================
-- AUDIT LOG (OPCIONAL)
-- ==========================================
INSERT INTO auditoria_geral (
    tabela,
    registro_id,
    acao,
    detalhes,
    executado_por,
    executado_em
)
VALUES (
    'avaliacoes',
    17,
    'UPDATE',
    'Correção manual: status alterado de "iniciada" para "concluida" após verificar 37 respostas completas. Bug na auto-conclusão.',
    'admin',
    NOW()
);

COMMIT;

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================
\echo '=== VERIFICAÇÃO FINAL ==='
SELECT 
    'Avaliação' as tipo,
    id,
    status,
    envio as data_conclusao,
    (SELECT COUNT(*) FROM respostas WHERE avaliacao_id = a.id) as total_respostas
FROM avaliacoes a
WHERE id = 17

UNION ALL

SELECT 
    'Resultados' as tipo,
    avaliacao_id as id,
    dominio as status,
    NULL as data_conclusao,
    COUNT(*) as total_respostas
FROM resultados
WHERE avaliacao_id = 17
GROUP BY avaliacao_id, dominio;
