-- Migration 068: Permitir perfil 'gestor' na constraint funcionarios_clinica_check
-- Data: 2026-01-05

BEGIN;

-- Remover constraint antiga (se existir)
ALTER TABLE IF EXISTS funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;

-- Adicionar nova constraint incluindo 'gestor'
ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_clinica_check CHECK (
    clinica_id IS NOT NULL
    OR perfil IN ('emissor', 'admin', 'gestor')
  );

COMMENT ON CONSTRAINT funcionarios_clinica_check ON funcionarios IS 'Permite funcionarios sem clinica_id quando perfil é emissor, admin ou gestor';

SELECT '068.1 Constraint funcionarios_clinica_check atualizada para aceitar gestor' as status;

COMMIT;

COMMENT ON EXTENSION plpgsql IS '=== MIGRATION 068: Concluída com sucesso ===';
