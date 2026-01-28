-- Migration 070: Atualiza constraint funcionarios_nivel_cargo_check para aceitar 'gestor_entidade'
-- Data: 2026-01-05

BEGIN;

-- Remover constraint antiga (se existir)
ALTER TABLE IF EXISTS funcionarios DROP CONSTRAINT IF EXISTS funcionarios_nivel_cargo_check;

-- Criar nova constraint incluindo 'gestor_entidade' e marcando NOT VALID para migração segura
ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_nivel_cargo_check CHECK (
    (
      perfil IN ('admin', 'rh', 'emissor', 'gestor_entidade')
    )
    OR (
      perfil = 'funcionario' AND nivel_cargo IS NOT NULL
    )
  ) NOT VALID;

COMMENT ON CONSTRAINT funcionarios_nivel_cargo_check ON funcionarios IS 'Permite gestores de entidade sem nivel_cargo; NOT VALID para migração incremental';

SELECT '070.1 Constraint funcionarios_nivel_cargo_check adicionada (NOT VALID)' as status;

COMMIT;
