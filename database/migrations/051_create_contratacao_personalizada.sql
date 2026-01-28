-- Migration 051: Criar tabela `contratacao_personalizada` (compatibilidade para fluxos legacy/tests)
-- Data: 2025-12-26

CREATE TABLE IF NOT EXISTS contratacao_personalizada (
  id SERIAL PRIMARY KEY,
  contratante_id INTEGER REFERENCES contratantes(id) ON DELETE CASCADE,
  numero_funcionarios_estimado INTEGER,
  valor_por_funcionario DECIMAL(10,2),
  valor_total_estimado DECIMAL(12,2),
  payment_link_token VARCHAR(128),
  payment_link_expiracao TIMESTAMP,
  link_enviado_em TIMESTAMP,
  status VARCHAR(50) DEFAULT 'aguardando_valor',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contratacao_personalizada_token ON contratacao_personalizada (payment_link_token);
CREATE INDEX IF NOT EXISTS idx_contratacao_personalizada_contratante ON contratacao_personalizada (contratante_id);

COMMENT ON TABLE contratacao_personalizada IS 'Tabela de compatibilidade para contratacao personalizada (fluxo legacy e testes)';
COMMENT ON COLUMN contratacao_personalizada.status IS 'Estados: aguardando_valor, valor_definido, aguardando_pagamento, pagamento_confirmado, cancelado';
COMMENT ON COLUMN contratacao_personalizada.link_enviado_em IS 'Timestamp de quando o link de pagamento foi gerado/enviado ao contratante';
