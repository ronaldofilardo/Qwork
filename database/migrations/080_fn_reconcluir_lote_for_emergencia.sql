-- Migração: Função para tentar reconcluir um lote manualmente (usada por endpoints administrativos/emergência)
-- Data: 2026-01-28

BEGIN;

CREATE OR REPLACE FUNCTION fn_reconcluir_lote_for_emergencia(p_lote_id integer)
RETURNS boolean AS $$
DECLARE
  v_liberadas int;
  v_concluidas int;
  v_inativadas int;
  v_updated int;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status != 'rascunho')::int,
    COUNT(*) FILTER (WHERE status = 'concluida')::int,
    COUNT(*) FILTER (WHERE status = 'inativada')::int
  INTO v_liberadas, v_concluidas, v_inativadas
  FROM avaliacoes
  WHERE lote_id = p_lote_id;

  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = p_lote_id AND status IS DISTINCT FROM 'concluido'
    RETURNING 1 INTO v_updated;

    IF FOUND THEN
      INSERT INTO fila_emissao (lote_id, tentativas, max_tentativas, proxima_tentativa)
      VALUES (p_lote_id, 0, 3, NOW())
      ON CONFLICT (lote_id) DO NOTHING;
      RETURN TRUE;
    ELSE
      RETURN FALSE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

COMMIT;
