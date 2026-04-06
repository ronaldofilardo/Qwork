-- Migration 1144: Fix laudos.emissor_cpf FK to reference usuarios instead of funcionarios
--
-- Problema: laudos.emissor_cpf tem FK apontando para funcionarios(cpf),
-- mas emissores são usuários de plataforma armazenados em usuarios, não funcionarios.
-- A constraint "no_account_roles_in_funcionarios" proíbe emissores em funcionarios.
--
-- Solução: Remover as 3 FKs duplicadas que apontam para funcionarios e
-- adicionar uma nova FK apontando para usuarios(cpf).

BEGIN;

-- Remover FK constraints incorretas que referenciam funcionarios(cpf)
ALTER TABLE laudos DROP CONSTRAINT IF EXISTS fk_laudos_emissor_cpf;
ALTER TABLE laudos DROP CONSTRAINT IF EXISTS laudos_emissor_cpf_fkey;
ALTER TABLE laudos DROP CONSTRAINT IF EXISTS laudos_emissor_cpf_fkey1;

-- Adicionar FK correta apontando para usuarios(cpf)
ALTER TABLE laudos
  ADD CONSTRAINT fk_laudos_emissor_cpf
  FOREIGN KEY (emissor_cpf) REFERENCES usuarios(cpf) ON DELETE RESTRICT;

COMMIT;
