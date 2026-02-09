-- Fix mínimo pós-reset: colunas e tabela usada por testes rápidos
BEGIN;

-- Garante que a coluna email exista
ALTER TABLE IF EXISTS tomadores
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Garante que a coluna plano_id exista (sem FK para evitar dependência de ordens de migração)
ALTER TABLE IF EXISTS tomadores
  ADD COLUMN IF NOT EXISTS plano_id INTEGER;

-- Tabela mínima esperada por testes: mapeamento contratante <-> funcionário (usada em cleans)
CREATE TABLE IF NOT EXISTS tomadores_funcionarios (
  contratante_id INTEGER NOT NULL,
  funcionario_cpf VARCHAR(32) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (contratante_id, funcionario_cpf)
);

COMMIT;
