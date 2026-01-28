-- Migration 075: Tornar verificar_conclusao_lote defensiva para comparar status como texto (compatibilidade com DB de teste)
-- Data: 2026-01-05

BEGIN;

CREATE OR REPLACE FUNCTION verificar_conclusao_lote()
RETURNS TRIGGER AS $$
DECLARE
  v_lote_id INTEGER;
  v_total_avaliacoes INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_avaliacoes_inativadas INTEGER;
  v_avaliacoes_pendentes INTEGER;
BEGIN
  v_lote_id := COALESCE(NEW.lote_id, OLD.lote_id);
  IF v_lote_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status::text = 'concluida') as concluidas,
    COUNT(*) FILTER (WHERE status::text = 'inativada') as inativadas,
    COUNT(*) FILTER (WHERE status::text IN ('iniciada', 'em_andamento')) as pendentes
  INTO
    v_total_avaliacoes,
    v_avaliacoes_concluidas,
    v_avaliacoes_inativadas,
    v_avaliacoes_pendentes
  FROM avaliacoes
  WHERE lote_id = v_lote_id;

  IF v_avaliacoes_pendentes = 0 AND (v_avaliacoes_concluidas + v_avaliacoes_inativadas) = v_total_avaliacoes THEN
    UPDATE lotes_avaliacao
    SET status = 'concluido'::status_lote,
        atualizado_em = NOW()
    WHERE id = v_lote_id
      AND status::text <> 'concluido';

    RAISE NOTICE 'Lote % marcado como concluido: % concluidas, % inativadas, % pendentes', 
      v_lote_id, v_avaliacoes_concluidas, v_avaliacoes_inativadas, v_avaliacoes_pendentes;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verificar_conclusao_lote() IS 'Versão defensiva: compara status como texto para suportar DBs sem enum';

COMMIT;
