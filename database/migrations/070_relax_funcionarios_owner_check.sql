-- Migration 070: Allow gestor in funcionarios_owner_check
-- Date: 2026-01-15
-- Description: Relax owner-check constraint to accept perfil 'gestor' so entity managers can be created without clinica_id

BEGIN;

ALTER TABLE IF EXISTS funcionarios DROP CONSTRAINT IF EXISTS funcionarios_owner_check;

ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_owner_check CHECK (
    (clinica_id IS NOT NULL AND entidade_id IS NULL)
    OR (entidade_id IS NOT NULL AND clinica_id IS NULL)
    OR (perfil IN ('emissor', 'gestor'))
  ) NOT VALID;

COMMENT ON CONSTRAINT funcionarios_owner_check ON funcionarios IS 'Permite gestor sem clinica_id (NOT VALID para migração incremental)';

COMMIT;

DO $$ BEGIN RAISE NOTICE 'Migration 070 applied: funcionarios_owner_check relaxed (NOT VALID)'; END $$;