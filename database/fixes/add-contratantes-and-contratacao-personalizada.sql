-- Script de compatibilidade: adiciona colunas usadas por testes e cria contratacao_personalizada mínima
BEGIN;

ALTER TABLE IF EXISTS contratantes
  ADD COLUMN IF NOT EXISTS telefone VARCHAR(32),
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS cidade VARCHAR(128),
  ADD COLUMN IF NOT EXISTS estado VARCHAR(8),
  ADD COLUMN IF NOT EXISTS cep VARCHAR(20),
  ADD COLUMN IF NOT EXISTS responsavel_nome VARCHAR(255),
  ADD COLUMN IF NOT EXISTS responsavel_cpf VARCHAR(32),
  ADD COLUMN IF NOT EXISTS responsavel_cargo VARCHAR(128),
  ADD COLUMN IF NOT EXISTS responsavel_telefone VARCHAR(32),
  ADD COLUMN IF NOT EXISTS responsavel_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS numero_funcionarios INTEGER,
  ADD COLUMN IF NOT EXISTS status VARCHAR(64);

-- Tabela contratacao_personalizada (estrutura mínima usada pelos testes)
CREATE TABLE IF NOT EXISTS contratacao_personalizada (
  id SERIAL PRIMARY KEY,
  contratante_id INTEGER NOT NULL,
  plano_id INTEGER NOT NULL,
  numero_funcionarios INTEGER NOT NULL,
  status VARCHAR(64) DEFAULT 'pendente',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
