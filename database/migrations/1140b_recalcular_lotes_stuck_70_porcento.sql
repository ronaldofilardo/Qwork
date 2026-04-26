-- Migration 1140: RECÁLCULO ÚNICO - Lotes Bloqueados na Regra de 70%
--
-- CONTEXTO:
--   O trigger fn_recalcular_status_lote_on_avaliacao_update só dispara em tempo real
--   (UPDATE em avaliacoes). Lotes que já atingiram 70% ANTES de o trigger ser criado,
--   ou por sequência de eventos fora da janela do trigger, ficaram "presos" em 'ativo'.
--
-- REGRA VIGENTE (Migration 1130 — confirmada pelo usuário):
--   total_liberadas = COUNT WHERE status != 'rascunho'  (INCLUI inativadas)
--   threshold       = CEIL(0.7 * total_liberadas)
--   libera          = concluidas >= threshold
--
-- EXEMPLO LOTE #46:
--   10 funcionários: 7 concluídas + 2 iniciadas + 1 inativada
--   total_liberadas = 10  →  threshold = CEIL(7.0) = 7
--   concluídas = 7  →  7 >= 7  →  LIBERA ✅
--
-- O QUE ESTA MIGRATION FAZ:
--   1. Garante que o trigger está aplicado com a fórmula correta (inclui inativadas)
--   2. Recalcula ONE-TIME todos os lotes 'ativo' que já deveriam ser 'concluido'
--   3. Registra auditoria dos lotes corrigidos

BEGIN;

-- ===========================================================================
-- 1. REAFIRMAR TRIGGER COM FÓRMULA CORRETA (inclui inativadas no denominador)
-- ===========================================================================

CREATE OR REPLACE FUNCTION fn_recalcular_status_lote_on_avaliacao_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lote_id INTEGER;
  v_total_liberadas INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_threshold_70 INTEGER;
  v_lote_status status_lote;
BEGIN
  -- Determinar lote_id da avaliação alterada
  v_lote_id := COALESCE(NEW.lote_id, OLD.lote_id);

  IF v_lote_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar status atual do lote — só processar lotes 'ativo'
  SELECT status INTO v_lote_status
  FROM lotes_avaliacao
  WHERE id = v_lote_id;

  IF v_lote_status != 'ativo' THEN
    RETURN NEW;
  END IF;

  -- Contar avaliações do lote:
  -- total_liberadas = status != 'rascunho'  (INCLUI inativadas — conforme regra de negócio)
  -- concluidas = status = 'concluida'
  SELECT
    COUNT(*) FILTER (WHERE status != 'rascunho')::int,
    COUNT(*) FILTER (WHERE status = 'concluida')::int
  INTO
    v_total_liberadas,
    v_avaliacoes_concluidas
  FROM avaliacoes
  WHERE lote_id = v_lote_id;

  -- Threshold: CEIL(70% das liberadas)
  v_threshold_70 := CEIL(0.7 * v_total_liberadas::NUMERIC);

  IF v_total_liberadas > 0 AND v_avaliacoes_concluidas >= v_threshold_70 THEN
    UPDATE lotes_avaliacao
    SET
      status = 'concluido'::status_lote,
      atualizado_em = NOW()
    WHERE id = v_lote_id
      AND status = 'ativo';

    RAISE NOTICE 'Lote % marcado como concluído (política 70%%): % concluídas de % liberadas (threshold: %)',
      v_lote_id, v_avaliacoes_concluidas, v_total_liberadas, v_threshold_70;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_recalcular_status_lote_on_avaliacao_update() IS
'Recalcula status do lote quando avaliação muda.
Política 70%: lote passa para "concluido" quando avaliacoes_concluidas >= CEIL(0.7 * total_liberadas).
total_liberadas = status != rascunho (INCLUI inativadas — regra de negócio confirmada).
Migration 1140: reafirmou fórmula + recalcular lotes bloqueados.';

-- ===========================================================================
-- 2. RECÁLCULO ÚNICO: Corrigir lotes 'ativo' que já atingiram 70%
-- ===========================================================================

DO $$
DECLARE
  v_lote_id INTEGER;
  v_total_liberadas INTEGER;
  v_concluidas INTEGER;
  v_threshold INTEGER;
  v_corrigidos INTEGER := 0;
BEGIN
  -- Iterar por todos os lotes 'ativo' que já passaram do threshold
  FOR v_lote_id, v_total_liberadas, v_concluidas, v_threshold IN
    SELECT
      a.lote_id,
      COUNT(*) FILTER (WHERE a.status != 'rascunho')::int as total_liberadas,
      COUNT(*) FILTER (WHERE a.status = 'concluida')::int as concluidas,
      CEIL(0.7 * COUNT(*) FILTER (WHERE a.status != 'rascunho')::NUMERIC)::int as threshold
    FROM avaliacoes a
    INNER JOIN lotes_avaliacao la ON la.id = a.lote_id
    WHERE la.status = 'ativo'
    GROUP BY a.lote_id
    HAVING
      COUNT(*) FILTER (WHERE a.status != 'rascunho') > 0
      AND COUNT(*) FILTER (WHERE a.status = 'concluida') >=
          CEIL(0.7 * COUNT(*) FILTER (WHERE a.status != 'rascunho')::NUMERIC)
  LOOP
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = v_lote_id AND status = 'ativo';

    v_corrigidos := v_corrigidos + 1;
    RAISE NOTICE 'Lote % corrigido: % concluídas de % liberadas (threshold=%)',
      v_lote_id, v_concluidas, v_total_liberadas, v_threshold;
  END LOOP;

  RAISE NOTICE 'Migration 1140: % lote(s) corrigido(s) de ''ativo'' para ''concluido''', v_corrigidos;
END;
$$;

COMMIT;
