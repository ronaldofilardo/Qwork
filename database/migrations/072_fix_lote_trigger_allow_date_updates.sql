-- Migration: 072_fix_lote_trigger_allow_date_updates.sql
-- Allow updates to emitido_em, enviado_em, processamento_em fields even after laudo emission
-- This fixes the issue where these fields weren't being set during emission

-- Function to prevent update/delete on lotes_avaliacao when a laudo has been emitted
-- But allow updates to date fields when they are being set from NULL to a value
CREATE OR REPLACE FUNCTION public.prevent_modification_lote_when_laudo_emitted()
RETURNS TRIGGER AS $$
DECLARE
  has_laudo_emitted BOOLEAN := FALSE;
  only_date_fields_changed BOOLEAN := TRUE;
  changed_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    -- Check if there's an emitted laudo for this lote
    SELECT EXISTS(SELECT 1 FROM laudos WHERE lote_id = OLD.id AND emitido_em IS NOT NULL) INTO has_laudo_emitted;

    IF has_laudo_emitted THEN
      -- If laudo is emitted, check what fields are being changed
      IF TG_OP = 'UPDATE' THEN
        -- Check if only date/timestamp fields are being updated from NULL to a value
        IF (OLD.emitido_em IS NULL AND NEW.emitido_em IS NOT NULL) OR
           (OLD.enviado_em IS NULL AND NEW.enviado_em IS NOT NULL) OR
           (OLD.processamento_em IS NOT NULL AND NEW.processamento_em IS NULL) OR
           (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'finalizado') THEN
          -- Allow updates to date fields or status to 'finalizado'
          RETURN NEW;
        END IF;

        -- Check if any other fields are being changed
        IF OLD.titulo IS DISTINCT FROM NEW.titulo OR
           OLD.descricao IS DISTINCT FROM NEW.descricao OR
           OLD.tipo IS DISTINCT FROM NEW.tipo OR
           OLD.liberado_por IS DISTINCT FROM NEW.liberado_por OR
           OLD.liberado_em IS DISTINCT FROM NEW.liberado_em OR
           OLD.criado_em IS DISTINCT FROM NEW.criado_em OR
           OLD.contratante_id IS DISTINCT FROM NEW.contratante_id OR
           OLD.auto_emitir_em IS DISTINCT FROM NEW.auto_emitir_em OR
           OLD.auto_emitir_agendado IS DISTINCT FROM NEW.auto_emitir_agendado OR
           OLD.hash_pdf IS DISTINCT FROM NEW.hash_pdf OR
           OLD.numero_ordem IS DISTINCT FROM NEW.numero_ordem OR
           OLD.cancelado_automaticamente IS DISTINCT FROM NEW.cancelado_automaticamente OR
           OLD.motivo_cancelamento IS DISTINCT FROM NEW.motivo_cancelamento OR
           OLD.modo_emergencia IS DISTINCT FROM NEW.modo_emergencia OR
           OLD.motivo_emergencia IS DISTINCT FROM NEW.motivo_emergencia THEN
          RAISE EXCEPTION 'Não é permitido alterar lote %: laudo já emitido. Apenas campos de data podem ser atualizados.', OLD.id;
        END IF;

        -- Allow the update if only allowed fields changed
        RETURN NEW;
      END IF;

      -- For DELETE operations, always prevent
      IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Não é permitido deletar lote %: laudo já emitido.', OLD.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.prevent_modification_lote_when_laudo_emitted() IS 'Impede UPDATE/DELETE em lotes quando houver laudo emitido, mas permite atualizações de campos de data';