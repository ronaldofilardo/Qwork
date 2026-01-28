-- Migration: Adicionar tabela de links de uso único para pagamentos personalizados
-- Data: 2026-01-15

BEGIN;

CREATE TABLE IF NOT EXISTS payment_links (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) NOT NULL UNIQUE,
  contrato_id INTEGER NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  criado_por_cpf VARCHAR(11),
  usado BOOLEAN NOT NULL DEFAULT false,
  usado_em TIMESTAMP,
  expiracao TIMESTAMP,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_links_contrato_id ON payment_links(contrato_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_usado ON payment_links(usado) WHERE usado = false;

COMMENT ON TABLE payment_links IS 'Links de uso único enviados pelo admin para permitir pagamento de planos personalizados';
COMMENT ON COLUMN payment_links.token IS 'Token público do link (uso único)';
COMMENT ON COLUMN payment_links.expiracao IS 'Data/hora de expiração do link (opcional)';

COMMIT;
