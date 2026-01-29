-- Migration: Safe auto-emission of laudo without using legacy placeholder '00000000000'
-- Date: 2026-01-29

BEGIN;

-- Replace function fn_recalcular_status_lote_on_avaliacao_update to avoid using hardcoded placeholder
CREATE OR REPLACE FUNCTION fn_recalcular_status_lote_on_avaliacao_update()
RETURNS trigger AS $$
DECLARE
  v_liberadas int;
  v_concluidas int;
  v_inativadas int;
  v_emissor_cpf char(11);
BEGIN
  -- Only act when status changed
  IF TG_OP <> 'UPDATE' OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE status != 'rascunho')::int,
    COUNT(*) FILTER (WHERE status = 'concluida')::int,
    COUNT(*) FILTER (WHERE status = 'inativada')::int
  INTO v_liberadas, v_concluidas, v_inativadas
  FROM avaliacoes
  WHERE lote_id = NEW.lote_id;

  -- If conclusion condition is satisfied, update lote and attempt to emit laudo
  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = NEW.lote_id AND status IS DISTINCT FROM 'concluido';

    -- Try select an active emissor (ignore legacy placeholder)
    SELECT cpf INTO v_emissor_cpf
    FROM funcionarios
    WHERE perfil = 'emissor' AND ativo = true AND cpf <> '00000000000' AND perfil <> 'admin'
    ORDER BY criado_em ASC
    LIMIT 1;

    IF v_emissor_cpf IS NOT NULL THEN
      -- We have a valid emissor; perform idempotent upsert to mark laudo as sent
      PERFORM upsert_laudo(NEW.lote_id, v_emissor_cpf, 'Laudo gerado automaticamente', 'enviado');
    ELSE
      -- No emissor available: leave laudo as rascunho (it will have been reserved at lote creation)
      -- Record an admin notification for manual intervention
      BEGIN
        INSERT INTO notificacoes_admin (tipo, mensagem, lote_id, criado_em)
        VALUES ('sem_emissor', format('Lote %s concluído mas nenhum emissor ativo encontrado — laudo permanece em rascunho', NEW.lote_id), NEW.lote_id, NOW());
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Falha ao registrar notificacao_admin (sem_emissor): %', SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
