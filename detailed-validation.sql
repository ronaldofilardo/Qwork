-- Verificação completa da segregacao

-- 1. Verificar lotes que violam a primeira parte da constraint
-- (clinica_id IS NOT NULL AND empresa_id IS NOT NULL AND entidade_id IS NULL)
SELECT 'Verificação 1: Clinica com empresa (esperado TRUE)' as test,
  COUNT(*) as count
FROM lotes_avaliacao 
WHERE clinica_id IS NOT NULL 
  AND empresa_id IS NOT NULL 
  AND entidade_id IS NULL;

-- 2. Verificar lotes que violam a segunda parte
-- (entidade_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL)
SELECT 'Verificação 2: Entidade sem clinica/empresa (esperado TRUE)' as test,
  COUNT(*) as count
FROM lotes_avaliacao 
WHERE entidade_id IS NOT NULL 
  AND clinica_id IS NULL 
  AND empresa_id IS NULL;

-- 3. Contar TODOS os lotes válidos
SELECT 'Validação CORRETA (V1 + V2)' as test,
  (
    SELECT COUNT(*) FROM lotes_avaliacao 
    WHERE (clinica_id IS NOT NULL AND empresa_id IS NOT NULL AND entidade_id IS NULL) 
       OR (entidade_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL)
  ) as valid_count,
  COUNT(*) as total
FROM lotes_avaliacao;

-- 4. Contar lotes INVÁLIDOS
SELECT 'Violações reais' as test,
  COUNT(*) as invalid_count
FROM lotes_avaliacao 
WHERE NOT (
  (clinica_id IS NOT NULL AND empresa_id IS NOT NULL AND entidade_id IS NULL) 
  OR 
  (entidade_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL)
);
