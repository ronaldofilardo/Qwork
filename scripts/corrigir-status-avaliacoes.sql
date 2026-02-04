-- Script de Manutenção: Corrigir Status de Avaliações
-- Data: 04/02/2026
-- Objetivo: Atualizar status de avaliações que têm respostas mas ainda estão como "iniciada"

-- ==========================================
-- 1. DIAGNÓSTICO
-- ==========================================
\echo '=== 1. AVALIAÇÕES COM RESPOSTAS MAS STATUS INCORRETO ==='
SELECT 
    a.id,
    a.funcionario_cpf,
    a.lote_id,
    a.status,
    COUNT(DISTINCT r.id) as total_respostas,
    MAX(r.criado_em) as ultima_resposta
FROM avaliacoes a
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.status = 'iniciada'
GROUP BY a.id, a.funcionario_cpf, a.lote_id, a.status
HAVING COUNT(DISTINCT r.id) > 0
ORDER BY a.id;

-- ==========================================
-- 2. CORREÇÃO AUTOMÁTICA
-- ==========================================
\echo ''
\echo '=== 2. ATUALIZANDO STATUS PARA EM_ANDAMENTO ==='
BEGIN;

UPDATE avaliacoes a
SET 
    status = 'em_andamento',
    atualizado_em = NOW()
WHERE a.status = 'iniciada'
  AND EXISTS (
    SELECT 1 FROM respostas r 
    WHERE r.avaliacao_id = a.id
  )
  AND (
    SELECT COUNT(DISTINCT (r.grupo, r.item)) 
    FROM respostas r 
    WHERE r.avaliacao_id = a.id
  ) < 37;  -- Não atualizar se já tiver 37 respostas (será concluída automaticamente)

-- Verificar quantas foram atualizadas
\echo ''
\echo '=== 3. RESULTADO DA ATUALIZAÇÃO ==='
SELECT 
    a.id,
    a.funcionario_cpf,
    a.lote_id,
    a.status,
    COUNT(DISTINCT r.id) as total_respostas,
    a.atualizado_em
FROM avaliacoes a
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.status = 'em_andamento'
  AND a.atualizado_em > NOW() - INTERVAL '1 minute'
GROUP BY a.id, a.funcionario_cpf, a.lote_id, a.status, a.atualizado_em
ORDER BY a.id;

COMMIT;

-- ==========================================
-- 4. VERIFICAÇÃO FINAL
-- ==========================================
\echo ''
\echo '=== 4. VERIFICAÇÃO FINAL - TODAS AVALIAÇÕES ATIVAS ==='
SELECT 
    a.status,
    COUNT(*) as total,
    COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN a.id END) as com_respostas,
    COUNT(DISTINCT CASE WHEN r.id IS NULL THEN a.id END) as sem_respostas
FROM avaliacoes a
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.status IN ('iniciada', 'em_andamento', 'concluida')
GROUP BY a.status
ORDER BY 
    CASE a.status 
        WHEN 'iniciada' THEN 1
        WHEN 'em_andamento' THEN 2
        WHEN 'concluida' THEN 3
    END;

\echo ''
\echo '=== ✅ MANUTENÇÃO CONCLUÍDA ==='
