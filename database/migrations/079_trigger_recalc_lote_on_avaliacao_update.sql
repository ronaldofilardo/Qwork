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

  -- Se condição de conclusão for satisfeita, atualizar lote APENAS
  -- NOTA: Emissão de laudo é 100% MANUAL - não inserir em fila_emissao
  -- O RH/Entidade deve solicitar emissão via botão "Solicitar Emissão"
  -- O emissor então emite o laudo manualmente no dashboard
  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    -- Evitar writes desnecessários
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = NEW.lote_id AND status IS DISTINCT FROM 'concluido';

    -- REMOVIDO: Inserção automática em fila_emissao
    -- Motivo: Emissão de laudo deve ser 100% MANUAL pelo emissor
    -- Fluxo correto:
    --   1. RH/Entidade solicita emissão (POST /api/lotes/[loteId]/solicitar-emissao)
    --   2. Lote aparece no dashboard do emissor
    --   3. Emissor revisa e clica "Gerar Laudo" manualmente
    --   4. Sistema gera PDF e hash
    --   5. Emissor revisa e envia
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
