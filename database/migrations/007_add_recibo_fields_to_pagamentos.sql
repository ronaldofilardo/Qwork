-- Migration 007: Adicionar campos de recibo em pagamentos
-- Data: 2026-01-15
-- Descrição: Adiciona campos para referenciar o recibo gerado após confirmação de pagamento

-- Adicionar campos de referência ao recibo
ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS recibo_numero VARCHAR(50),
ADD COLUMN IF NOT EXISTS recibo_url VARCHAR(255);

-- Criar índice para busca por número de recibo
CREATE INDEX IF NOT EXISTS idx_pagamentos_recibo_numero ON pagamentos (recibo_numero);

-- Comentários
COMMENT ON COLUMN pagamentos.recibo_numero IS 'Número do recibo gerado após confirmação do pagamento (formato: REC-AAAA-NNNNN)';
COMMENT ON COLUMN pagamentos.recibo_url IS 'URL para visualização do recibo gerado';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migration 007 executada: campos recibo_numero e recibo_url adicionados em pagamentos';
END $$;
