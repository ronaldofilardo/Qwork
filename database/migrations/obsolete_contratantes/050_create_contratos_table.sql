-- Migration 050: Criar tabela 'contratos' base
-- Data: 2025-12-26
-- Descrição: Cria tabela contratos com colunas mínimas usadas pelo sistema

CREATE TABLE IF NOT EXISTS contratos (
  id SERIAL PRIMARY KEY,
  contratante_id INTEGER REFERENCES tomadores(id) ON DELETE CASCADE,
  plano_id INTEGER REFERENCES planos(id),
  numero_funcionarios INTEGER,
  numero_funcionarios_estimado INTEGER,
  valor_total DECIMAL(12,2),
  valor_personalizado DECIMAL(12,2),
  conteudo TEXT,
  conteudo_gerado TEXT,
  aceito BOOLEAN DEFAULT FALSE,
  ip_aceite VARCHAR(45),
  data_aceite TIMESTAMP,
  status VARCHAR(50) DEFAULT 'generated',
  payment_link_token VARCHAR(128),
  payment_link_expiracao TIMESTAMP,
  link_enviado_em TIMESTAMP,
  criado_por_cpf VARCHAR(11),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos (status);
CREATE INDEX IF NOT EXISTS idx_contratos_numero_funcionarios ON contratos (numero_funcionarios);
CREATE INDEX IF NOT EXISTS idx_contratos_contratante ON contratos (contratante_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_contratos_payment_link_token ON contratos (payment_link_token) WHERE payment_link_token IS NOT NULL;

COMMENT ON TABLE contratos IS 'Contratos gerados para tomadores. Fluxo simplificado.';
COMMENT ON COLUMN contratos.valor_personalizado IS 'Valor negociado por funcionário para contratos personalizados';
