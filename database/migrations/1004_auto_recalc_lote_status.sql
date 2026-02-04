-- Migration 1004: Garantir recálculo automático de status do lote ao salvar avaliação
-- Data: 2026-02-04
-- Objetivo: Prevenir dessincronia entre status de avaliações e status do lote

BEGIN;

-- Verificar se a função de recálculo existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update'
  ) THEN
    RAISE EXCEPTION 'Função fn_recalcular_status_lote_on_avaliacao_update não existe';
  END IF;
END $$;

-- Criar trigger que recalcula status do lote automaticamente
CREATE OR REPLACE FUNCTION trg_recalc_lote_on_avaliacao_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular status do lote sempre que uma avaliação for modificada
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM fn_recalcular_status_lote_on_avaliacao_update(NEW.lote_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM fn_recalcular_status_lote_on_avaliacao_update(OLD.lote_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Dropar trigger antigo se existir com nome diferente
DROP TRIGGER IF EXISTS trg_recalc_lote_on_avaliacao_change ON avaliacoes;
DROP TRIGGER IF EXISTS trg_recalcular_lote_on_avaliacao ON avaliacoes;
DROP TRIGGER IF EXISTS trigger_recalc_lote_status ON avaliacoes;

-- Criar novo trigger
CREATE TRIGGER trg_recalc_lote_on_avaliacao_change
  AFTER INSERT OR UPDATE OR DELETE ON avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION trg_recalc_lote_on_avaliacao_change();

COMMENT ON FUNCTION trg_recalc_lote_on_avaliacao_change IS 
  'Recalcula automaticamente o status do lote quando avaliação é inserida/atualizada/deletada';

COMMENT ON TRIGGER trg_recalc_lote_on_avaliacao_change ON avaliacoes IS
  'Garante sincronização automática entre status de avaliações e status do lote';

-- Validação
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de recálculo automático instalado com sucesso';
  RAISE NOTICE 'Toda modificação em avaliacoes agora atualiza o status do lote automaticamente';
END $$;

COMMIT;
