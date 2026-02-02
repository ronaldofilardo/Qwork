-- Script para corrigir avaliação #51 e outras similares
-- Problema: Avaliações com status='concluida' mas sem concluida_em preenchido

BEGIN;

-- 1. Verificar o estado atual da avaliação #51
SELECT 
  id,
  funcionario_cpf,
  lote_id,
  status,
  envio,
  concluida_em,
  criado_em,
  inicio,
  (SELECT COUNT(*) FROM respostas WHERE avaliacao_id = 51) as total_respostas
FROM avaliacoes 
WHERE id = 51;

-- 2. Atualizar avaliação #51 para ter concluida_em igual a envio
UPDATE avaliacoes
SET concluida_em = envio,
    atualizado_em = NOW()
WHERE id = 51 
  AND status = 'concluida' 
  AND concluida_em IS NULL
  AND envio IS NOT NULL;

-- 3. Verificar se há outras avaliações com o mesmo problema
SELECT 
  id,
  funcionario_cpf,
  lote_id,
  status,
  envio,
  concluida_em
FROM avaliacoes 
WHERE status = 'concluida' 
  AND concluida_em IS NULL
  AND envio IS NOT NULL
ORDER BY id;

-- 4. Atualizar todas as avaliações com o mesmo problema
UPDATE avaliacoes
SET concluida_em = envio,
    atualizado_em = NOW()
WHERE status = 'concluida' 
  AND concluida_em IS NULL
  AND envio IS NOT NULL;

-- 5. Verificar o resultado final da avaliação #51
SELECT 
  a.id,
  a.funcionario_cpf,
  a.lote_id,
  a.status,
  a.envio,
  a.concluida_em,
  l.codigo as lote_codigo,
  l.status as lote_status,
  (SELECT COUNT(*) FROM respostas WHERE avaliacao_id = a.id) as total_respostas
FROM avaliacoes a
LEFT JOIN lotes_avaliacao l ON l.id = a.lote_id
WHERE a.id = 51;

-- 6. Forçar recálculo do status do lote
-- (chamando a função que deveria ter sido executada automaticamente)
SELECT recalcular_status_lote(lote_id) 
FROM avaliacoes 
WHERE id = 51;

COMMIT;

-- Informações adicionais para debug
SELECT 
  'Lote da avaliacao 51:' as info,
  l.id,
  l.codigo,
  l.status,
  l.total_avaliacoes,
  COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
  COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as inativadas,
  COUNT(CASE WHEN a.status NOT IN ('concluida', 'inativada') THEN 1 END) as pendentes
FROM lotes_avaliacao l
LEFT JOIN avaliacoes a ON a.lote_id = l.id
WHERE l.id = (SELECT lote_id FROM avaliacoes WHERE id = 51)
GROUP BY l.id, l.codigo, l.status, l.total_avaliacoes;
