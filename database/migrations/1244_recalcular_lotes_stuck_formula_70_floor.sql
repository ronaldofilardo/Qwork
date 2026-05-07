-- Migration 1244: Recalcular lotes "stuck" em 'concluido' com fórmula antiga (não atendem 70% FLOOR)
--
-- CONTEXTO:
--   Lote #39 foi marcado como 'concluido' usando fórmulas ANTIGAS (100% ou outras fórmulas não-70%).
--   Agora que todos os code paths usam fórmula 70% FLOOR corretamente,
--   esta migration recalcula lotes presos para o status CORRETO.
--
-- REGRA 70% (CORRETO — Migration 1243):
--   total_liberadas = COUNT WHERE status NOT IN ('rascunho', 'inativada')
--   threshold       = FLOOR(0.7 * total_liberadas)
--   lote concluido  = concluidas >= threshold E total_liberadas > 0
--
-- EXEMPLO LOTE #39:
--   Status: 'concluido' (ERRADO)
--   Avaliações: 5 totais, 0 concluídas, 5 "iniciada", 0 inativadas
--   liberadas = 5, threshold = FLOOR(3.5) = 3
--   0 < 3 → deveria estar 'ativo' (BLOQUEADO)
--
-- AÇÃO: Volta lotes marcados como 'concluido' que NÃO atendem 70% FLOOR

BEGIN;

-- Recalcular lotes 'concluido' que não atendem a fórmula 70% FLOOR
-- Estes lotes devem voltar para 'ativo' ou 'cancelado' baseado em critérios corretos
UPDATE lotes_avaliacao la
SET status = CASE 
  -- Se todas liberadas estão inativadas → 'cancelado'
  WHEN (
    SELECT COUNT(*) FILTER (WHERE status NOT IN ('rascunho', 'inativada'))
    FROM avaliacoes WHERE lote_id = la.id
  ) = 0 
    THEN 'cancelado'::status_lote
  -- Caso contrário → 'ativo' (para recalcular com trigger quando avaliação for concluída)
  ELSE 'ativo'::status_lote
END,
atualizado_em = NOW()
WHERE la.status = 'concluido'
  AND la.id IN (
    -- Identificar lotes 'concluido' que NÃO atendem 70% com fórmula NOVA
    SELECT a.lote_id
    FROM (
      SELECT 
        a.lote_id,
        COUNT(*) FILTER (WHERE a.status NOT IN ('rascunho', 'inativada'))::int as total_liberadas,
        COUNT(*) FILTER (WHERE a.status = 'concluida')::int as concluidas,
        FLOOR(0.7 * COUNT(*) FILTER (WHERE a.status NOT IN ('rascunho', 'inativada'))::NUMERIC)::int as threshold
      FROM avaliacoes a
      GROUP BY a.lote_id
    ) a
    WHERE a.total_liberadas > 0 AND a.concluidas < a.threshold
  );

-- Log
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM lotes_avaliacao
  WHERE status IN ('ativo', 'cancelado') AND atualizado_em >= NOW() - INTERVAL '10 seconds';
  
  RAISE NOTICE 'Migration 1244: % lote(s) corrigido(s) para status CORRETO baseado em fórmula 70%% FLOOR', v_count;
END;
$$;

COMMIT;
