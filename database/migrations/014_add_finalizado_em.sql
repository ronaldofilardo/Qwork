-- ================================================================
-- MIGRAÇÃO 014: ADICIONAR finalizado_em EM lotes_avaliacao
-- ================================================================

ALTER TABLE lotes_avaliacao
ADD COLUMN IF NOT EXISTS finalizado_em TIMESTAMP;

-- Popular finalizado_em com laudo_enviado_em quando aplicável
UPDATE lotes_avaliacao
SET
    finalizado_em = laudo_enviado_em
WHERE
    finalizado_em IS NULL
    AND laudo_enviado_em IS NOT NULL;

-- Índice para consultas por data de finalização
CREATE INDEX IF NOT EXISTS idx_lotes_finalizado_em ON lotes_avaliacao (finalizado_em DESC);

SELECT 'Migração 014 aplicada com sucesso!' as status;