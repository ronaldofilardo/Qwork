-- Migration: Criar tabela pagamentos com colunas de idempotência
-- Data: 2026-01-15
-- Objetivo: Suportar pagamentos com idempotência e rastreamento de transações externas

BEGIN;

-- Criar tabela pagamentos se não existir
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    contratante_id INTEGER NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    metodo VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pendente',
    plataforma_id VARCHAR(255),
    plataforma_nome VARCHAR(100),
    dados_adicionais JSONB,
    data_pagamento TIMESTAMP,
    data_confirmacao TIMESTAMP,
    comprovante_path VARCHAR(500),
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    numero_parcelas INTEGER DEFAULT 1,
    contrato_id INTEGER,
    detalhes_parcelas JSONB,
    
    -- Colunas de idempotency
    idempotency_key VARCHAR(255) UNIQUE,
    external_transaction_id VARCHAR(255),
    provider_event_id VARCHAR(255),
    
    -- Constraints
    CONSTRAINT check_numero_parcelas CHECK (numero_parcelas >= 1 AND numero_parcelas <= 12),
    CONSTRAINT pagamentos_metodo_check CHECK (metodo IN ('avista', 'parcelado', 'boleto', 'pix', 'cartao', 'transferencia')),
    CONSTRAINT pagamentos_status_check CHECK (status IN ('pendente', 'processando', 'pago', 'cancelado', 'estornado')),
    CONSTRAINT fk_pagamentos_contratante FOREIGN KEY (contratante_id) REFERENCES tomadores(id) ON DELETE CASCADE
);

-- Se a tabela já existir, adicionar as colunas de idempotency
DO $$
BEGIN
    -- Adicionar idempotency_key se não existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pagamentos' AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE pagamentos ADD COLUMN idempotency_key VARCHAR(255) UNIQUE;
    END IF;
    
    -- Adicionar external_transaction_id se não existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pagamentos' AND column_name = 'external_transaction_id'
    ) THEN
        ALTER TABLE pagamentos ADD COLUMN external_transaction_id VARCHAR(255);
    END IF;
    
    -- Adicionar provider_event_id se não existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pagamentos' AND column_name = 'provider_event_id'
    ) THEN
        ALTER TABLE pagamentos ADD COLUMN provider_event_id VARCHAR(255);
    END IF;
END$$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_contratante_id ON pagamentos(contratante_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_contrato_id ON pagamentos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_idempotency_key ON pagamentos(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_pagamentos_external_transaction_id ON pagamentos(external_transaction_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_provider_event_id ON pagamentos(provider_event_id);

-- Comentários
COMMENT ON TABLE pagamentos IS 'Registro de pagamentos de tomadores';
COMMENT ON COLUMN pagamentos.numero_parcelas IS 'Número de parcelas do pagamento (1 = à vista, 2-12 = parcelado)';
COMMENT ON COLUMN pagamentos.contrato_id IS 'Referência opcional ao contrato associado ao pagamento (pode ser NULL para pagamentos independentes)';
COMMENT ON COLUMN pagamentos.external_transaction_id IS 'ID da transação no gateway de pagamento (Stripe, Mercado Pago, etc) para rastreamento';
COMMENT ON COLUMN pagamentos.provider_event_id IS 'ID único do evento do provedor de pagamento (para deduplicação de webhooks)';
COMMENT ON COLUMN pagamentos.idempotency_key IS 'Chave de idempotência para evitar duplicação de pagamentos (opcional)';

COMMIT;
