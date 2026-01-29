-- Migration: Remove legacy default emissor '00000000000' from fn_reservar_id_laudo_on_lote_insert
-- Date: 2026-01-29

BEGIN;

-- 1) Replace function: set emissor_cpf to NULL instead of '00000000000'
CREATE OR REPLACE FUNCTION fn_reservar_id_laudo_on_lote_insert()
RETURNS trigger AS $$
BEGIN
  -- Reservar o mesmo ID para o laudo (em status rascunho) sem atribuir emissor padrão
  INSERT INTO laudos (id, lote_id, status, criado_em, atualizado_em)
  VALUES (NEW.id, NEW.id, 'rascunho', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger (idempotent)
DROP TRIGGER IF EXISTS trg_reservar_id_laudo_on_lote_insert ON lotes_avaliacao;
CREATE TRIGGER trg_reservar_id_laudo_on_lote_insert
AFTER INSERT ON lotes_avaliacao
FOR EACH ROW
EXECUTE FUNCTION fn_reservar_id_laudo_on_lote_insert();

-- 2) Fix existing rows with emissor_cpf = '00000000000' where it is safe to update (no emitido_em)
-- Set to NULL (will be populated by emission flow) and add admin notification

UPDATE laudos SET emissor_cpf = NULL, atualizado_em = NOW()
WHERE emissor_cpf = '00000000000' AND emitido_em IS NULL;

-- Record admin notification for any emitted laudos still using placeholder (requires manual attention)
INSERT INTO notificacoes_admin (tipo, mensagem, lote_id, criado_em)
SELECT 'emissor_legacy_detectado',
       format('Laudo %s (lote %s) possui emissor legado 00000000000 e já foi emitido — intervenção manual necessária', l.id, l.lote_id),
       l.lote_id, NOW()
FROM laudos l
WHERE l.emissor_cpf = '00000000000' AND l.emitido_em IS NOT NULL;

COMMIT;