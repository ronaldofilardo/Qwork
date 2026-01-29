-- Migração: Modificar trigger para gerar laudo imediatamente quando lote concluído
-- Data: 2026-01-28

BEGIN;

-- Atualizar função para gerar laudo diretamente em vez de enfileirar
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

  -- Se condição de conclusão for satisfeita, atualizar lote e gerar laudo imediatamente
  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    -- Evitar writes desnecessários no lote
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = NEW.lote_id AND status IS DISTINCT FROM 'concluido';

    -- Gerar laudo imediatamente (atualiza o laudo rascunho que já existe)
    PERFORM upsert_laudo(NEW.lote_id, '00000000000', 'Laudo gerado automaticamente', 'enviado');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Rollback manual (se necessário):
-- BEGIN; DROP FUNCTION IF EXISTS fn_recalcular_status_lote_on_avaliacao_update(); COMMIT;