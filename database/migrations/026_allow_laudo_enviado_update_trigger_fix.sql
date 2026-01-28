-- Migration 026: Ajusta trigger prevent_update_finalized_lote para permitir
-- atualização de campos de envio (laudo_enviado_em, finalizado_em) quando
-- já existe um laudo com status = 'enviado'.
-- Data: 2026-01-04

BEGIN;

-- Substituir função existente por uma versão com exceção controlada
CREATE OR REPLACE FUNCTION prevent_update_finalized_lote()
RETURNS TRIGGER AS $$
BEGIN
  -- Impedir modificação de lotes em estados terminais
  IF OLD.status IN ('finalizado', 'cancelado') THEN
    RAISE EXCEPTION 'Lote com status "%" não pode ser modificado', OLD.status;
  END IF;

  -- Se já existe um laudo com status 'enviado', bloquear alterações EXCETO quando
  -- a atualização tiver como objetivo registrar o envio (laudo_enviado_em) pela
  -- primeira vez. Isto permite que o processo de envio atualize o lote com
  -- timestamps de envio/finalização sem ser impedido pelo trigger.
  IF EXISTS (
    SELECT 1 FROM laudos WHERE lote_id = OLD.id AND status = 'enviado'
  ) THEN
    -- Permitir apenas a atualização que define pela PRIMEIRA vez laudo_enviado_em
    IF NOT (NEW.laudo_enviado_em IS NOT NULL AND OLD.laudo_enviado_em IS NULL) THEN
      RAISE EXCEPTION 'Lote possui laudo enviado. Modificações bloqueadas.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

COMMENT ON FUNCTION prevent_update_finalized_lote() IS 'Trigger atualizada para permitir registro de laudo_enviado_em mesmo quando já existe laudo com status=''enviado''';
