-- ===============================================================
-- Lote 7: Apagar respostas e resultados, resetar para liberacao
-- ===============================================================

BEGIN;

-- Configurar contexto de sessao
SET app.current_user_cpf = '00000000000';
SET app.current_user_perfil = 'admin';
SET app.bypass_rls = TRUE;

-- 1. Verificar estado ANTES
SELECT 
  'ANTES' as fase,
  la.id as lote_id,
  la.status as status_lote,
  COUNT(a.id) as total_avaliacoes,
  COUNT(a.id) FILTER (WHERE a.status = 'concluida') as concluidas,
  COUNT(a.id) FILTER (WHERE a.status = 'inativada') as inativadas
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON la.id = a.lote_id
WHERE la.id = 7
GROUP BY la.id, la.status;

SELECT 
  id,
  funcionario_cpf,
  status,
  (SELECT COUNT(*) FROM respostas WHERE avaliacao_id = avaliacoes.id) as qtd_respostas,
  (SELECT COUNT(*) FROM resultados WHERE avaliacao_id = avaliacoes.id) as qtd_resultados
FROM avaliacoes
WHERE lote_id = 7
ORDER BY id;

-- 2. Apagar respostas das avaliacoes
DELETE FROM respostas 
WHERE avaliacao_id IN (SELECT id FROM avaliacoes WHERE lote_id = 7);

-- 3. Apagar resultados das avaliacoes
DELETE FROM resultados 
WHERE avaliacao_id IN (SELECT id FROM avaliacoes WHERE lote_id = 7);

-- 4. Resetar timestamps de conclusao
UPDATE avaliacoes
SET 
  concluida_em = NULL,
  envio = NULL,
  atualizado_em = NOW()
WHERE lote_id = 7 
  AND status = 'concluida';

-- 5. Garantir status correto das avaliacoes: 'concluida' para prontas, 'inativada' para inativadas
UPDATE avaliacoes
SET 
  status = 'concluida',
  atualizado_em = NOW()
WHERE lote_id = 7 
  AND status NOT IN ('inativada', 'concluida');

-- 6. Garantir que lote esta em status 'concluido'
UPDATE lotes_avaliacao
SET 
  status = 'concluido',
  atualizado_em = NOW()
WHERE id = 7
  AND status != 'concluido';

-- 7. Verificar estado DEPOIS
SELECT 
  'DEPOIS' as fase,
  la.id as lote_id,
  la.status as status_lote,
  COUNT(a.id) as total_avaliacoes,
  COUNT(a.id) FILTER (WHERE a.status = 'concluida') as concluidas,
  COUNT(a.id) FILTER (WHERE a.status = 'inativada') as inativadas
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON la.id = a.lote_id
WHERE la.id = 7
GROUP BY la.id, la.status;

SELECT 
  id,
  funcionario_cpf,
  status,
  (SELECT COUNT(*) FROM respostas WHERE avaliacao_id = avaliacoes.id) as qtd_respostas,
  (SELECT COUNT(*) FROM resultados WHERE avaliacao_id = avaliacoes.id) as qtd_resultados
FROM avaliacoes
WHERE lote_id = 7
ORDER BY id;

COMMIT;
