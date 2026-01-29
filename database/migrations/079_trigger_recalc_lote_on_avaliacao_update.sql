-- Migração: Trigger para recalcular status do lote quando avaliações mudarem de status
-- Data: 2026-01-28

BEGIN;

-- 1. Função que recalcula e marca lote como concluído se (concluidas + inativadas) == liberadas
CREATE OR REPLACE FUNCTION fn_recalcular_status_lote_on_avaliacao_update()
RETURNS trigger AS $$
DECLARE
  v_liberadas int;
  v_concluidas int;
  v_inativadas int;
BEGIN
  -- Só agir quando houve alteração de status
  IF TG_OP <> 'UPDATE' OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Calcular estatísticas para o lote afetado
  SELECT
    COUNT(*) FILTER (WHERE status != 'rascunho')::int,
    COUNT(*) FILTER (WHERE status = 'concluida')::int,
    COUNT(*) FILTER (WHERE status = 'inativada')::int
  INTO v_liberadas, v_concluidas, v_inativadas
  FROM avaliacoes
  WHERE lote_id = NEW.lote_id;

  -- Se condição de conclusão for satisfeita, atualizar lote e inserir na fila de emissão
  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    -- Evitar writes desnecessários
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = NEW.lote_id AND status IS DISTINCT FROM 'concluido';

    -- Enfileirar emissão (idempotente)
    INSERT INTO fila_emissao (lote_id, tentativas, max_tentativas, proxima_tentativa)
    VALUES (NEW.lote_id, 0, 3, NOW())
    ON CONFLICT (lote_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger que executa a função após UPDATE de cada linha em avaliacoes
DROP TRIGGER IF EXISTS trg_recalc_lote_on_avaliacao_update ON avaliacoes;
CREATE TRIGGER trg_recalc_lote_on_avaliacao_update
AFTER UPDATE OF status ON avaliacoes
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION fn_recalcular_status_lote_on_avaliacao_update();

COMMIT;

-- Rollback manual (se necessário):
-- BEGIN; DROP TRIGGER IF EXISTS trg_recalc_lote_on_avaliacao_update ON avaliacoes; DROP FUNCTION IF EXISTS fn_recalcular_status_lote_on_avaliacao_update(); COMMIT;
