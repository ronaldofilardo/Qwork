-- Backfill: Popular campo laudo_status baseado em laudos existentes
-- Purpose: Marcar lotes que já têm laudos como 'emitido'
-- Execute: sempre com backup antes, aplicar em batches para evitar locks longos

-- IMPORTANTE: Execute em batches para evitar locks longos
-- Exemplo: adicione LIMIT 500 e execute múltiplas vezes até nenhuma linha ser afetada

BEGIN;

-- Marca como 'emitido' lotes que já têm laudo
UPDATE lotes_avaliacao l
SET 
  laudo_status = 'emitido',
  laudo_emissao_at = COALESCE(l.laudo_emissao_at, now()),
  laudo_uuid = COALESCE(l.laudo_uuid, gen_random_uuid())
WHERE l.laudo_status IS NULL
  AND EXISTS (
    SELECT 1 FROM laudos x WHERE x.lote_id = l.id
  );
-- LIMIT 500; -- Descomente para execução em batches

COMMIT;

-- Verificação pós-backfill
-- SELECT 
--   COUNT(*) FILTER (WHERE laudo_status = 'emitido') as emitidos,
--   COUNT(*) FILTER (WHERE laudo_status IS NULL) as pendentes,
--   COUNT(*) as total
-- FROM lotes;
