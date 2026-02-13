-- ========================================
-- Validação da Migration 1008
-- ========================================

-- 1. Verificar status de distribuição de lotes
SELECT 
  'Distribuição de Lotes' as validacao,
  COUNT(CASE WHEN entidade_id IS NOT NULL THEN 1 END) as lotes_entidade,
  COUNT(CASE WHEN clinica_id IS NOT NULL THEN 1 END) as lotes_clinica,
  COUNT(CASE WHEN entidade_id IS NULL AND clinica_id IS NULL THEN 1 END) as lotes_orfaos,
  COUNT(*) as total_lotes
FROM lotes_avaliacao;

-- 2. Verificar se há dados inválidos (violação de segregação)
SELECT 
  'Lotes com Violação' as validacao,
  COUNT(*) as total_invalidos
FROM lotes_avaliacao 
WHERE (entidade_id IS NOT NULL AND clinica_id IS NOT NULL)
   OR (entidade_id IS NOT NULL AND empresa_id IS NULL AND clinica_id IS NULL);

-- 3. Contar funcionários por entidade
SELECT 
  'Funcionarios Mapeados' as validacao,
  COUNT(DISTINCT fe.entidade_id) as entidades_com_funcionarios,
  COUNT(DISTINCT f.id) as total_funcionarios
FROM funcionarios_entidades fe
JOIN funcionarios f ON fe.funcionario_id = f.id
WHERE fe.ativo = true;

-- 4. Verificar lotes de entidade sem dados migrados
SELECT 
  'Lotes de Entidade Sem Migration' as validacao,
  COUNT(*) as total
FROM lotes_avaliacao 
WHERE entidade_id IS NULL AND clinica_id IS NULL;
