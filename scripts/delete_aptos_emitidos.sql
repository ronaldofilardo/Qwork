-- Script destrutivo: Deletar lotes aptos para emissão e laudos emitidos
-- ATENÇÃO: Esta operação é irreversível. Executar somente se estiver consciente do impacto.
-- Critério: lotes com status IN ('ativo','concluido') e laudos com status IN ('emitido','enviado')

BEGIN;

-- Deletar respostas vinculadas a avaliações desses lotes
DELETE FROM respostas
WHERE avaliacao_id IN (
  SELECT id FROM avaliacoes WHERE lote_id IN (
    SELECT id FROM lotes_avaliacao WHERE status IN ('ativo','concluido')
  )
);

-- Deletar avaliações vinculadas a esses lotes
DELETE FROM avaliacoes
WHERE lote_id IN (
  SELECT id FROM lotes_avaliacao WHERE status IN ('ativo','concluido')
);

-- Deletar laudos emitidos ou associados a esses lotes
DELETE FROM laudos
WHERE status IN ('emitido','enviado')
   OR lote_id IN (SELECT id FROM lotes_avaliacao WHERE status IN ('ativo','concluido'));

-- Deletar os lotes
DELETE FROM lotes_avaliacao
WHERE status IN ('ativo','concluido');

COMMIT;

-- Observação: Remover arquivos em storage (ex: storage/laudos) manualmente, se aplicável.
