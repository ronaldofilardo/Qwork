-- ============================================================================
-- Migration: 1230 — Fix prevent_modification_lote_when_laudo_emitted
-- Data: 2026-04-27
-- Descrição: Adiciona exceção para permitir a transição laudo_emitido → finalizado
--            mesmo quando laudos.emitido_em IS NOT NULL.
--
--            Contexto: após confirmar-assinatura setar status='emitido' + emitido_em,
--            o trigger bloqueava o upload/route.ts de avançar o lote para 'finalizado'.
--            A transição laudo_emitido → finalizado é o passo final esperado do fluxo.
-- ============================================================================

BEGIN;

\echo '======================================================='
\echo 'FIX: prevent_modification_lote_when_laudo_emitted'
\echo '======================================================='

CREATE OR REPLACE FUNCTION prevent_modification_lote_when_laudo_emitted()
RETURNS trigger AS $$
DECLARE
  v_has_laudo BOOLEAN := FALSE;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    -- Exceção: permitir transição laudo_emitido → finalizado (upload final do laudo ao bucket)
    -- Esta é a única transição de estado esperada após o laudo ser emitido.
    IF TG_OP = 'UPDATE' AND OLD.status = 'laudo_emitido' AND NEW.status = 'finalizado' THEN
      RETURN NEW;
    END IF;

    -- desligar temporariamente row level security para a checagem interna
    PERFORM set_config('row_security', 'off', true);
    SELECT EXISTS(SELECT 1 FROM laudos WHERE lote_id = OLD.id AND emitido_em IS NOT NULL) INTO v_has_laudo;
    IF v_has_laudo THEN
      RAISE EXCEPTION 'Não é permitido alterar/deletar lote %: laudo já emitido.', OLD.id
        USING HINT = 'Lotes com laudos emitidos são imutáveis.', ERRCODE = '23506';
    END IF;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

\echo 'OK: função prevent_modification_lote_when_laudo_emitted atualizada'

COMMIT;
