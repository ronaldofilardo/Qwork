-- MIGRATION 110: Add processamento_em column to lotes_avaliacao
-- Purpose: Ensure local dev DB has processamento_em timestamp for processing state
BEGIN;

ALTER TABLE IF EXISTS lotes_avaliacao
  ADD COLUMN IF NOT EXISTS processamento_em TIMESTAMP;

COMMENT ON COLUMN lotes_avaliacao.processamento_em IS 'Timestamp efêmero indicando que emissão está em processamento';

COMMIT;