-- Migration 303: Fix lotes_avaliacao liberado_por foreign key to reference contratantes_senhas instead of funcionarios
-- Since gestores are now separated and use contratantes_senhas for authentication

BEGIN;

-- Drop the old foreign key constraint
ALTER TABLE lotes_avaliacao DROP CONSTRAINT IF EXISTS lotes_avaliacao_liberado_por_fkey;

-- Add new foreign key to contratantes_senhas(cpf)
-- Assuming cpf is unique in contratantes_senhas (as used for login)
ALTER TABLE lotes_avaliacao
ADD CONSTRAINT lotes_avaliacao_liberado_por_fkey
FOREIGN KEY (liberado_por) REFERENCES contratantes_senhas (cpf);

COMMIT;