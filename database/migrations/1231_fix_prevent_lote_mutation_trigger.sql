-- Migration: Fix prevent_lote_mutation_during_emission
-- Remove referência a coluna 'codigo' inexistente e
-- permite mudanças de status mesmo com laudo emitido.
BEGIN;

CREATE OR REPLACE FUNCTION prevent_lote_mutation_during_emission()
RETURNS TRIGGER LANGUAGE plpgsql AS $BODY$
BEGIN
  IF TG_OP = 'INSERT' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF EXISTS (
      SELECT 1 FROM laudos
      WHERE lote_id = OLD.id
        AND status IN ('emitido', 'enviado')
    ) THEN
      -- Bloquear apenas campos de negócio; mudanças de status são permitidas
      IF OLD.empresa_id IS DISTINCT FROM NEW.empresa_id
         OR OLD.setor_id IS DISTINCT FROM NEW.setor_id THEN
        RAISE EXCEPTION 'Nao e permitido alterar campos criticos de lote com laudo emitido';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$BODY$;

COMMIT;
