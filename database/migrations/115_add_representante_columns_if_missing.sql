-- Migration 115: Ensure representative columns exist on empresas_clientes
-- Adds columns used by RH UI (representante_nome, representante_fone, representante_email)

ALTER TABLE empresas_clientes
  ADD COLUMN IF NOT EXISTS representante_nome TEXT,
  ADD COLUMN IF NOT EXISTS representante_fone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS representante_email VARCHAR(100);

COMMENT ON COLUMN empresas_clientes.representante_nome IS 'Nome do representante legal da empresa (opcional)';
COMMENT ON COLUMN empresas_clientes.representante_fone IS 'Telefone do representante (opcional)';
COMMENT ON COLUMN empresas_clientes.representante_email IS 'Email do representante (opcional)';

-- No-op if columns already exist (safe to run repeatedly)

SELECT 'Migration 115 executed';