-- Script to delete incorrectly created lote 004-050126
-- Date: 2026-01-05
-- Issue: Lote was created with Miguel and Sophia despite recent completion
-- Solution: Delete lote and its evaluations

BEGIN;

-- 1. Show lote details before deletion
SELECT 
  'BEFORE DELETION' as action,
  l.id,
  l.codigo,
  l.numero_ordem,
  l.status,
  COUNT(a.id) as total_avaliacoes,
  STRING_AGG(f.nome, ', ' ORDER BY f.nome) as funcionarios
FROM lotes_avaliacao l
LEFT JOIN avaliacoes a ON a.lote_id = l.id
LEFT JOIN funcionarios f ON f.cpf = a.funcionario_cpf
WHERE l.codigo = '004-050126'
GROUP BY l.id, l.codigo, l.numero_ordem, l.status;

-- 2. Delete avaliacoes first (FK constraint)
DELETE FROM avaliacoes WHERE lote_id = 23;

-- 3. Delete lote
DELETE FROM lotes_avaliacao WHERE id = 23;

-- 4. Reset funcionarios to correct state
UPDATE funcionarios
SET 
  ultimo_lote_codigo = '002-050126',
  ultima_avaliacao_id = (
    SELECT id FROM avaliacoes 
    WHERE funcionario_cpf = funcionarios.cpf 
    ORDER BY COALESCE(envio, inativada_em, inicio) DESC 
    LIMIT 1
  )
WHERE cpf IN ('81766465200', '91412434203', '58806994476', '20915930102');

-- 5. Verify final state
SELECT 
  'AFTER DELETION' as action,
  cpf,
  nome,
  indice_avaliacao,
  ultimo_lote_codigo,
  ultima_avaliacao_status,
  TO_CHAR(ultima_avaliacao_data_conclusao, 'DD/MM/YYYY HH24:MI') as data_conclusao
FROM funcionarios
WHERE cpf IN ('81766465200', '91412434203', '58806994476', '20915930102')
ORDER BY nome;

-- 6. Verify lote no longer exists
SELECT 
  'VERIFICATION' as action,
  COUNT(*) as lotes_004_050126_remaining
FROM lotes_avaliacao
WHERE codigo = '004-050126';

COMMIT;
