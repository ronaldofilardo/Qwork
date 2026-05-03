-- Migration 072: Ajustar constraint funcionarios_clinica_check para permitir funcionarios vinculados a contratante
-- Data: 2026-01-05

BEGIN;

-- Remover versão antiga da constraint, se existir
ALTER TABLE IF EXISTS funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;

-- Adicionar constraint que permite: (a) clinica_id preenchido, (b) contratante_id preenchido, (c) perfis específicos
-- Usar NOT VALID para não validar registros existentes (eles serão validados na próxima atualização)
ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_clinica_check CHECK (
    clinica_id IS NOT NULL
    OR contratante_id IS NOT NULL
    OR perfil IN ('emissor', 'admin', 'gestao')
  ) NOT VALID;

COMMENT ON CONSTRAINT funcionarios_clinica_check ON funcionarios IS
'Permite funcionarios sem clinica_id quando vinculados a um contratante (contratante_id preenchido) ou quando perfil é emissor/admin/gestao.';

SELECT '072.1 Constraint funcionarios_clinica_check atualizada para aceitar contratante_id' as status;

COMMIT;