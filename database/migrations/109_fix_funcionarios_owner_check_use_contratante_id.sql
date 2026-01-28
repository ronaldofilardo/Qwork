-- Migration 109: Fix funcionarios_owner_check to use contratante_id instead of entidade_id
-- Data: 2026-01-15

BEGIN;

-- Drop old constraint
ALTER TABLE IF EXISTS funcionarios DROP CONSTRAINT IF EXISTS funcionarios_owner_check;

-- Add corrected constraint using contratante_id
ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_owner_check CHECK (
    (clinica_id IS NOT NULL AND contratante_id IS NULL)
    OR (contratante_id IS NOT NULL AND clinica_id IS NULL)
    OR (perfil IN ('emissor', 'master', 'gestor_entidade'))
  ) NOT VALID;

COMMENT ON CONSTRAINT funcionarios_owner_check ON funcionarios IS 'Permite gestores de entidade sem clinica_id; usa contratante_id para entidades (NOT VALID para migração incremental)';

COMMIT;
