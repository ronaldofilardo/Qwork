-- Migration: Adicionar campos para fluxo de pagamento aos contratos
-- Data: 2025-12-26

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'generated',
  ADD COLUMN IF NOT EXISTS numero_funcionarios INTEGER,
  ADD COLUMN IF NOT EXISTS valor_personalizado DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS payment_link_token VARCHAR(128),
  ADD COLUMN IF NOT EXISTS payment_link_expiracao TIMESTAMP,
  ADD COLUMN IF NOT EXISTS link_enviado_em TIMESTAMP,
  ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMP,
  ADD COLUMN IF NOT EXISTS criado_por_cpf VARCHAR(11);

CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos (status);
CREATE INDEX IF NOT EXISTS idx_contratos_numero_funcionarios ON contratos (numero_funcionarios);

COMMENT ON COLUMN contratos.status IS 'Status extra usado para controle de pagamento (payment_pending, payment_paid, etc.)';
COMMENT ON COLUMN contratos.valor_personalizado IS 'Valor negociado por funcionário para contratos personalizados';
