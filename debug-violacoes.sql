-- Verificar quais são os lotes com "violação"
SELECT 
  id,
  entidade_id,
  clinica_id,
  empresa_id,
  status,
  criado_em
FROM lotes_avaliacao 
WHERE entidade_id IS NOT NULL 
  AND clinica_id IS NOT NULL;
