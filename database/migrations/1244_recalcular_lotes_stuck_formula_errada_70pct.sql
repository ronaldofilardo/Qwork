-- Migration 1244: Recalcular lotes "stuck" que ficaram com status errado (fórmula 100% em vez de 70%)
--
-- PROBLEMA:
--   Lotes foram marcados como 'concluido' usando fórmula ERRADA:
--   - Antiga: `concluidas + inativadas === liberadas` (100% concluído + inativado)
--   - Liberadas incluía inativadas: COUNT(status != 'rascunho')
--
-- NOVO:
--   - Fórmula 70%: concluidas >= FLOOR(0.7 * liberadas)
--   - Liberadas exclui inativadas: COUNT(status NOT IN ('rascunho', 'inativada'))
--
-- EXEMPLO (Lote #39):
--   - 5 avaliações, TODAS "iniciada"
--   - Fórmula 100% (ERRADA): liberadas=5 (inclui inativadas), concluidas+inativadas=0+0, 0 !== 5 → FALSE (esperado)
--     MAS lote estava marcado como 'concluido' (sync error com BD anterior)
--   - Fórmula 70% (CORRETA): liberadas=5, concluidas >= FLOOR(3.5) = 3, 0 >= 3 → FALSE
--     Lote deve voltar para 'ativo' ou permanecer 'concluido' se concluidas >= 3

BEGIN;

-- Desabilitar temporariamente a trigger que valida transições
ALTER TABLE lotes_avaliacao DISABLE TRIGGER trg_validar_transicao_status_lote;

-- ===========================================================================
-- Recalcular todos os lotes 'concluido' que deveriam estar 'ativo'
-- ===========================================================================
DO $$
DECLARE
  v_lote_id INTEGER;
  v_liberadas INTEGER;
  v_concluidas INTEGER;
  v_inativadas INTEGER;
  v_threshold INTEGER;
  v_status_esperado TEXT;
  v_recalculados INTEGER := 0;
  v_bloqueados INTEGER := 0;
BEGIN
  -- Encontrar todos os lotes 'concluido' que NOT atendem a fórmula 70%
  FOR v_lote_id, v_liberadas, v_concluidas, v_inativadas, v_threshold IN
    SELECT
      a.lote_id,
      COUNT(*) FILTER (WHERE a.status NOT IN ('rascunho', 'inativada'))::int as liberadas,
      COUNT(*) FILTER (WHERE a.status = 'concluida')::int as concluidas,
      COUNT(*) FILTER (WHERE a.status = 'inativada')::int as inativadas,
      FLOOR(0.7 * COUNT(*) FILTER (WHERE a.status NOT IN ('rascunho', 'inativada'))::NUMERIC)::int as threshold
    FROM avaliacoes a
    INNER JOIN lotes_avaliacao la ON la.id = a.lote_id
    WHERE la.status = 'concluido'  -- Apenas lotes já marcados como concluido
    GROUP BY a.lote_id
  LOOP
    -- Verificar se deveria estar 'concluido' com a fórmula 70%
    IF v_liberadas > 0 AND v_concluidas >= v_threshold THEN
      -- Está correto, manter como 'concluido'
      v_bloqueados := v_bloqueados + 1;
    ELSE
      -- Não atende critério 70%, voltar para 'ativo'
      UPDATE lotes_avaliacao
      SET status = 'ativo', atualizado_em = NOW()
      WHERE id = v_lote_id;
      
      v_recalculados := v_recalculados + 1;
      RAISE NOTICE 'Lote % recalculado: % concluídas / % liberadas (threshold=%, % inativadas) → revertido para ATIVO',
        v_lote_id, v_concluidas, v_liberadas, v_threshold, v_inativadas;
    END IF;
  END LOOP;

  RAISE NOTICE 'Migration 1244: % lote(s) recalculado(s) de ''concluido'' para ''ativo'' (fórmula 70%%). %  lote(s) permaneceram ''concluido'' (corretos)',
    v_recalculados, v_bloqueados;
END;
$$;

-- Reabilitar a trigger
ALTER TABLE lotes_avaliacao ENABLE TRIGGER trg_validar_transicao_status_lote;

COMMIT;
