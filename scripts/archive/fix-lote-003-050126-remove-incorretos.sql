-- Script to fix lote 003-050126 - Remove employees incorrectly included
-- Date: 2026-01-05
-- Issue: Miguel Barbosa (81766465200) and Sophia Castro (91412434203) 
--        were included despite completing evaluation just 1 day ago

BEGIN;

-- 1. Delete incorrect evaluations from lote 003-050126
DELETE FROM avaliacoes
WHERE lote_id = 22
  AND funcionario_cpf IN ('81766465200', '91412434203')
  AND status = 'iniciada';

-- 2. Verify deletion
SELECT 
  'Deleted evaluations for Miguel and Sophia from lote 003-050126' as action,
  (SELECT COUNT(*) FROM avaliacoes WHERE lote_id = 22) as remaining_evaluations;

-- 3. Update funcionarios to reflect correct ultimo_lote
UPDATE funcionarios
SET 
  ultimo_lote_codigo = '002-050126',
  ultima_avaliacao_id = (
    SELECT id FROM avaliacoes 
    WHERE funcionario_cpf = funcionarios.cpf 
    ORDER BY COALESCE(envio, inativada_em, inicio) DESC 
    LIMIT 1
  )
WHERE cpf IN ('81766465200', '91412434203');

-- 4. Verify final state
SELECT 
  cpf,
  nome,
  indice_avaliacao,
  ultimo_lote_codigo,
  ultima_avaliacao_status,
  ultima_avaliacao_data_conclusao,
  EXTRACT(DAY FROM NOW() - ultima_avaliacao_data_conclusao)::INTEGER as dias_desde_conclusao
FROM funcionarios
WHERE cpf IN ('81766465200', '91412434203')
ORDER BY nome;

COMMIT;
