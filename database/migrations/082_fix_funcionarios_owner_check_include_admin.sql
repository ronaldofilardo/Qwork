-- Migration 082: Ajusta funcionarios_owner_check para permitir perfil 'admin'
-- Data: 2026-01-24

BEGIN;

ALTER TABLE IF EXISTS funcionarios DROP CONSTRAINT IF EXISTS funcionarios_owner_check;

ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_owner_check CHECK (
    (clinica_id IS NOT NULL AND contratante_id IS NULL)
    OR (contratante_id IS NOT NULL AND clinica_id IS NULL)
    OR (perfil IN ('emissor', 'admin', 'gestor'))
  ) NOT VALID;

COMMENT ON CONSTRAINT funcionarios_owner_check ON funcionarios IS 'Permite gestores de entidade sem clinica_id; inclui admin e emissor (NOT VALID para migração incremental)';

COMMIT;
