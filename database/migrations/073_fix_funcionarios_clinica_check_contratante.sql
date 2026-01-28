-- Migration 073: Corrigir constraint funcionarios_clinica_check para aceitar contratante_id
-- Data: 2026-01-23
-- Contexto: Funcionários de entidades devem poder ser criados com contratante_id (sem clinica_id)
--           A migration 072 tinha a lógica correta mas não foi aplicada ao banco dev

BEGIN;

-- Remover versão antiga da constraint, se existir
ALTER TABLE IF EXISTS funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;

-- Adicionar constraint que permite:
-- (a) clinica_id preenchido, OU
-- (b) contratante_id preenchido, OU
-- (c) perfis específicos (emissor, admin, gestao)
-- NOT VALID para não validar registros existentes (validação incremental)
ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_clinica_check CHECK (
    clinica_id IS NOT NULL
    OR contratante_id IS NOT NULL
    OR perfil IN ('emissor', 'admin', 'gestao')
  ) NOT VALID;

COMMENT ON CONSTRAINT funcionarios_clinica_check ON funcionarios IS
'Permite funcionarios sem clinica_id quando vinculados a um contratante (contratante_id preenchido) ou quando perfil é emissor/admin/gestao.';

SELECT '073.1 Constraint funcionarios_clinica_check atualizada para aceitar contratante_id (correção da migration 072)' as status;

COMMIT;
