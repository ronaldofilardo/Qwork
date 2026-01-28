-- Migration: 071_protect_after_emissao.sql
-- Prevent modifications to lotes_avaliacao and avaliacoes after a laudo has been emitted

-- Function to prevent update/delete on lotes_avaliacao when a laudo has been emitted
CREATE OR REPLACE FUNCTION public.prevent_modification_lote_when_laudo_emitted()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM laudos WHERE lote_id = OLD.id AND emitido_em IS NOT NULL) THEN
      RAISE EXCEPTION 'Não é permitido alterar/deletar lote %: laudo já emitido.', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_lote_after_emit ON public.lotes_avaliacao;
CREATE TRIGGER trg_protect_lote_after_emit
BEFORE UPDATE OR DELETE ON public.lotes_avaliacao
FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_lote_when_laudo_emitted();

-- Function to prevent update/delete on avaliacoes when the parent lote has a laudo emitted
CREATE OR REPLACE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
  v_lote INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    v_lote := COALESCE(NEW.lote_id, OLD.lote_id);
    SELECT COUNT(*) INTO v_count FROM laudos WHERE lote_id = v_lote AND emitido_em IS NOT NULL;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'Não é permitido alterar/deletar avaliação %: laudo do lote % já foi emitido.', COALESCE(NEW.id, OLD.id), v_lote;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_avaliacao_after_emit ON public.avaliacoes;
CREATE TRIGGER trg_protect_avaliacao_after_emit
BEFORE UPDATE OR DELETE ON public.avaliacoes
FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted();
