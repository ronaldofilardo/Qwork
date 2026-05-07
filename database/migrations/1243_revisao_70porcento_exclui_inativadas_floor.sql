-- Migration 1243: Revisão da Política 70% — Excluir inativadas do denominador + FLOOR
--
-- PROBLEMA CORRIGIDO:
--   A fórmula anterior usava CEIL e incluía inativadas no denominador, dificultando
--   a solicitação de laudo quando havia muitas avaliações inativadas.
--
-- NOVA REGRA:
--   total_liberadas = COUNT WHERE status NOT IN ('rascunho', 'inativada')
--   threshold       = FLOOR(0.7 * total_liberadas)
--
-- EXEMPLO:
--   10 funcionários, 4 inativadas, 6 ativas, 5 concluídas
--   Antes: CEIL(0.7 * 10) = 7  →  bloqueado
--   Depois: FLOOR(0.7 * 6) = 4  →  5 >= 4  →  LIBERA ✅
--
-- Arquivos de código afetados (já corrigidos antes desta migration):
--   - lib/validacao-lote-laudo.ts
--   - app/api/lotes/[loteId]/solicitar-emissao/route.ts

BEGIN;

-- ===========================================================================
-- 1. TRIGGER FUNCTION — fórmula revisada
-- ===========================================================================
CREATE OR REPLACE FUNCTION fn_recalcular_status_lote_on_avaliacao_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lote_id INTEGER;
  v_total_liberadas INTEGER;
  v_total_inativadas INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_threshold_70 INTEGER;
  v_lote_status status_lote;
BEGIN
  v_lote_id := COALESCE(NEW.lote_id, OLD.lote_id);

  IF v_lote_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT status INTO v_lote_status
  FROM lotes_avaliacao
  WHERE id = v_lote_id;

  IF v_lote_status != 'ativo' THEN
    RETURN NEW;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE status NOT IN ('rascunho', 'inativada'))::int,
    COUNT(*) FILTER (WHERE status = 'inativada')::int,
    COUNT(*) FILTER (WHERE status = 'concluida')::int
  INTO
    v_total_liberadas,
    v_total_inativadas,
    v_avaliacoes_concluidas
  FROM avaliacoes
  WHERE lote_id = v_lote_id;

  -- FLOOR: arredondar para baixo (favorece o tomador)
  v_threshold_70 := FLOOR(0.7 * v_total_liberadas::NUMERIC);

  IF v_total_liberadas > 0 AND v_avaliacoes_concluidas >= v_threshold_70 THEN
    UPDATE lotes_avaliacao
    SET
      status = 'concluido'::status_lote,
      atualizado_em = NOW()
    WHERE id = v_lote_id
      AND status = 'ativo';

    RAISE NOTICE 'Lote % concluído (70%%): % concluídas / % liberadas (threshold=%), % inativadas excluídas',
      v_lote_id, v_avaliacoes_concluidas, v_total_liberadas, v_threshold_70, v_total_inativadas;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_recalcular_status_lote_on_avaliacao_update() IS
'Recalcula status do lote quando avaliação muda.
Política 70% (Migration 1243): threshold = FLOOR(0.7 * total_liberadas).
total_liberadas = status NOT IN (rascunho, inativada) — inativadas excluídas do denominador.';

-- ===========================================================================
-- 2. RECÁLCULO ÚNICO — liberar lotes presos em ''ativo'' que já atingiram 70%
-- ===========================================================================
DO $$
DECLARE
  v_lote_id INTEGER;
  v_total_liberadas INTEGER;
  v_total_inativadas INTEGER;
  v_concluidas INTEGER;
  v_threshold INTEGER;
  v_corrigidos INTEGER := 0;
BEGIN
  FOR v_lote_id, v_total_liberadas, v_total_inativadas, v_concluidas, v_threshold IN
    SELECT
      a.lote_id,
      COUNT(*) FILTER (WHERE a.status NOT IN ('rascunho', 'inativada'))::int,
      COUNT(*) FILTER (WHERE a.status = 'inativada')::int,
      COUNT(*) FILTER (WHERE a.status = 'concluida')::int,
      FLOOR(0.7 * COUNT(*) FILTER (WHERE a.status NOT IN ('rascunho', 'inativada'))::NUMERIC)::int
    FROM avaliacoes a
    INNER JOIN lotes_avaliacao la ON la.id = a.lote_id
    WHERE la.status = 'ativo'
    GROUP BY a.lote_id
    HAVING
      COUNT(*) FILTER (WHERE a.status NOT IN ('rascunho', 'inativada')) > 0
      AND COUNT(*) FILTER (WHERE a.status = 'concluida') >=
          FLOOR(0.7 * COUNT(*) FILTER (WHERE a.status NOT IN ('rascunho', 'inativada'))::NUMERIC)
  LOOP
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = v_lote_id AND status = 'ativo';

    v_corrigidos := v_corrigidos + 1;
    RAISE NOTICE 'Lote % corrigido: % concluídas / % liberadas (threshold=%, % inativadas)',
      v_lote_id, v_concluidas, v_total_liberadas, v_threshold, v_total_inativadas;
  END LOOP;

  RAISE NOTICE 'Migration 1243: % lote(s) corrigido(s) para ''concluido''', v_corrigidos;
END;
$$;

COMMIT;
