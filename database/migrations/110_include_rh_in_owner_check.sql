-- Migration 110: Include 'rh' in funcionarios_owner_check
-- Date: 2026-01-26
-- Description: Allow perfil 'rh' to be accepted by owner-check so RH accounts
-- can be created/updated without violating the constraint in tests and runtime.

BEGIN;

ALTER TABLE IF EXISTS funcionarios DROP CONSTRAINT IF EXISTS funcionarios_owner_check;

ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_owner_check CHECK (
    (clinica_id IS NOT NULL AND contratante_id IS NULL)
    OR (contratante_id IS NOT NULL AND clinica_id IS NULL)
    OR (perfil IN ('emissor', 'admin', 'gestor', 'rh'))
  ) NOT VALID;

COMMENT ON CONSTRAINT funcionarios_owner_check ON funcionarios IS 'Permite gestores de entidade sem clinica_id; inclui admin, emissor e rh (NOT VALID para migração incremental)';

COMMIT;

DO $$ BEGIN RAISE NOTICE 'Migration 110 applied: funcionarios_owner_check now allows perfil rh (NOT VALID)'; END $$;
