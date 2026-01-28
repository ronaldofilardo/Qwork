-- Migration 070: Allow gestor_entidade in funcionarios_owner_check
-- Date: 2026-01-15
-- Description: Relax owner-check constraint to accept perfil 'gestor_entidade' so entity managers can be created without clinica_id

BEGIN;

ALTER TABLE IF EXISTS funcionarios DROP CONSTRAINT IF EXISTS funcionarios_owner_check;

ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_owner_check CHECK (
    (clinica_id IS NOT NULL AND entidade_id IS NULL)
    OR (entidade_id IS NOT NULL AND clinica_id IS NULL)
    OR (perfil IN ('emissor', 'master', 'gestor_entidade'))
  ) NOT VALID;

COMMENT ON CONSTRAINT funcionarios_owner_check ON funcionarios IS 'Permite gestor_entidade sem clinica_id (NOT VALID para migração incremental)';

COMMIT;

DO $$ BEGIN RAISE NOTICE 'Migration 070 applied: funcionarios_owner_check relaxed (NOT VALID)'; END $$;