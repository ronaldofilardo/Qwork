-- Migration 069: Adiciona constraint funcionarios_clinica_check NOT VALID para permitir deploy sem bloquear rows existentes
-- Data: 2026-01-05

BEGIN;

-- Remover constraint antiga caso exista
ALTER TABLE IF EXISTS funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;

-- Adicionar nova constraint incluindo 'gestor_entidade' e marcá-la NOT VALID para não bloquear dados existentes
ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_clinica_check CHECK (
    clinica_id IS NOT NULL
    OR perfil IN ('emissor', 'admin', 'gestor_entidade')
  ) NOT VALID;

COMMENT ON CONSTRAINT funcionarios_clinica_check ON funcionarios IS 'Permite funcionarios sem clinica_id quando perfil é emissor, admin ou gestor_entidade (NOT VALID para permitir migração incremental)';

SELECT '069.1 Constraint funcionarios_clinica_check adicionada (NOT VALID) para permitir migração segura' as status;

COMMIT;
