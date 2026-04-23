-- Migration 1230: Configurações dinâmicas das taxas do gateway de pagamento
-- Permite ao admin configurar taxas por método sem redeploy.
-- tipo='taxa_fixa'  → valor em R$
-- tipo='percentual' → valor em %

CREATE TABLE IF NOT EXISTS configuracoes_gateway (
  codigo        VARCHAR(40) PRIMARY KEY,
  descricao     VARCHAR(100),
  tipo          VARCHAR(20) NOT NULL CHECK (tipo IN ('taxa_fixa', 'percentual')),
  valor         NUMERIC(10,4) NOT NULL DEFAULT 0,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE configuracoes_gateway IS
  'Taxas do gateway de pagamento por método. tipo=taxa_fixa→R$; tipo=percentual→%.';

-- Seeds: valores-padrão Asaas
INSERT INTO configuracoes_gateway (codigo, descricao, tipo, valor) VALUES
  ('impostos',          'Impostos (%)',                 'percentual',  7.00),
  ('boleto',            'Boleto bancário',             'taxa_fixa',   2.90),
  ('pix',               'PIX',                         'percentual',  0.99),
  ('credit_card_1x',    'Cartão à vista (1x)',          'percentual',  2.10),
  ('credit_card_2_6x',  'Cartão parcelado (2 a 6x)',    'percentual',  2.50),
  ('credit_card_7_12x', 'Cartão parcelado (7 a 12x)',   'percentual',  3.00),
  ('taxa_transacao',    'Taxa por transação (R$ fixo)',  'taxa_fixa',   0.00)
ON CONFLICT (codigo) DO NOTHING;
