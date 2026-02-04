-- Migration 1005: Criar função fn_recalcular_status_lote_on_avaliacao_update e corrigir trigger
-- Data: 2026-02-04
-- Problema: Trigger criado na migration 1004 tentava chamar função que não existe em produção

BEGIN;

-- Criar a função de recálculo de status (baseada na migration 150)
CREATE OR REPLACE FUNCTION fn_recalcular_status_lote_on_avaliacao_update()
RETURNS trigger AS $$
DECLARE
  v_liberadas int;
  v_concluidas int;
  v_inativadas int;
  v_lote_id int;
BEGIN
  -- Determinar lote_id baseado na operação
  IF TG_OP = 'DELETE' THEN
    v_lote_id := OLD.lote_id;
  ELSE
    v_lote_id := NEW.lote_id;
  END IF;

  -- Para UPDATE, só agir quando houve alteração de status
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Calcular estatísticas para o lote afetado
  SELECT
    COUNT(*) FILTER (WHERE status != 'rascunho')::int,
    COUNT(*) FILTER (WHERE status = 'concluida')::int,
    COUNT(*) FILTER (WHERE status = 'inativada')::int
  INTO v_liberadas, v_concluidas, v_inativadas
  FROM avaliacoes
  WHERE lote_id = v_lote_id;

  -- Se condição de conclusão for satisfeita, atualizar lote
  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = v_lote_id AND status IS DISTINCT FROM 'concluido';
  ELSIF v_liberadas > 0 AND v_concluidas > 0 THEN
    -- Se tem liberadas e concluídas, mas ainda não todas: em_andamento
    UPDATE lotes_avaliacao
    SET status = 'em_andamento', atualizado_em = NOW()
    WHERE id = v_lote_id AND status = 'liberado';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_recalcular_status_lote_on_avaliacao_update() IS 
'Recalcula status do lote quando avaliação muda. Marca lote como concluído quando todas avaliações liberadas estão finalizadas (concluídas ou inativadas). Emissão de laudo é manual.';

-- Recriar trigger corrigido (chamada direta, sem wrapper)
DROP TRIGGER IF EXISTS trg_recalc_lote_on_avaliacao_change ON avaliacoes;

-- Trigger chama diretamente a função de trigger (sem wrapper!)
CREATE TRIGGER trg_recalc_lote_on_avaliacao_change
  AFTER INSERT OR UPDATE OR DELETE ON avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION fn_recalcular_status_lote_on_avaliacao_update();

COMMENT ON TRIGGER trg_recalc_lote_on_avaliacao_change ON avaliacoes IS 
  'Recalcula automaticamente status do lote quando avaliação muda';

-- Validação
DO $$
BEGIN
  RAISE NOTICE '✅ Função fn_recalcular_status_lote_on_avaliacao_update criada';
  RAISE NOTICE '✅ Trigger trg_recalc_lote_on_avaliacao_change corrigido';
  RAISE NOTICE 'Sincronização automática entre avaliações e lote ativada';
END $$;

COMMIT;
