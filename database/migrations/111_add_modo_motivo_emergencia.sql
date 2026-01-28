-- MIGRATION 111: Add modo_emergencia and motivo_emergencia to lotes_avaliacao
BEGIN;

ALTER TABLE IF EXISTS lotes_avaliacao
  ADD COLUMN IF NOT EXISTS modo_emergencia BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS motivo_emergencia TEXT;

COMMENT ON COLUMN lotes_avaliacao.modo_emergencia IS 'Indica se laudo foi emitido via modo emergência (flag)';
COMMENT ON COLUMN lotes_avaliacao.motivo_emergencia IS 'Justificativa para uso do modo emergência';

COMMIT;