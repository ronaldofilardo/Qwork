-- Migration 1021: Corrigir trigger prevent_modification_lote_when_laudo_emitted
-- Data: 18/03/2026
-- Problema: Trigger (versão migration 030) bloqueia ALL UPDATEs quando laudo emitido,
--           impedindo status → 'finalizado' + laudo_enviado_em após upload ao bucket.
-- Solução: Permitir UPDATE que avança status para 'finalizado' e atualiza timestamps.
--           Continua bloqueando: DELETE, mudança de campos de identidade (empresa_id,
--           clinica_id, entidade_id, tipo), e status para qualquer valor != 'finalizado'.

CREATE OR REPLACE FUNCTION public.prevent_modification_lote_when_laudo_emitted()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM laudos WHERE lote_id = OLD.id AND emitido_em IS NOT NULL) THEN
      RAISE EXCEPTION 'Não é permitido deletar lote %: laudo já emitido.', OLD.id
        USING HINT = 'Lotes com laudos emitidos são imutáveis.', ERRCODE = '23506';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Se não há laudo emitido, qualquer UPDATE é permitido
    IF NOT EXISTS (SELECT 1 FROM laudos WHERE lote_id = OLD.id AND emitido_em IS NOT NULL) THEN
      RETURN NEW;
    END IF;

    -- Bloqueia alteração de campos de identidade do lote
    IF OLD.empresa_id IS DISTINCT FROM NEW.empresa_id
       OR OLD.clinica_id IS DISTINCT FROM NEW.clinica_id
       OR OLD.entidade_id IS DISTINCT FROM NEW.entidade_id
       OR OLD.tipo IS DISTINCT FROM NEW.tipo THEN
      RAISE EXCEPTION 'Não é permitido alterar campos de identidade do lote %: laudo já emitido.', OLD.id
        USING HINT = 'Lotes com laudos emitidos são imutáveis nestes campos.', ERRCODE = '23506';
    END IF;

    -- Permite status → 'finalizado' (laudo enviado ao bucket)
    -- Bloqueia qualquer outro status diferente do atual
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status != 'finalizado' THEN
      RAISE EXCEPTION 'Não é permitido alterar status do lote % para %: laudo já emitido.', OLD.id, NEW.status
        USING HINT = 'Após emissão, status só pode avançar para finalizado.', ERRCODE = '23506';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.prevent_modification_lote_when_laudo_emitted() IS
'Migration 1021 (18/03/2026): Permite status→finalizado e timestamps após upload ao bucket. Bloqueia: DELETE, mudança de empresa_id/clinica_id/entidade_id/tipo, status para valor diferente de finalizado.';
