-- Criar tabela pagamentos (dev/test simplificada)
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
    recibo_url TEXT,
    recibo_numero VARCHAR(50),
    detalhes_parcelas JSONB,
    numero_funcionarios INTEGER,
    valor_por_funcionario NUMERIC(10,2),
    contrato_id INTEGER
);

-- à ndices e constraints úteis
CREATE INDEX IF NOT EXISTS idx_pagamentos_contratante ON pagamentos (contratante_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos (status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_contrato_id ON pagamentos (contrato_id);

COMMENT ON TABLE pagamentos IS 'Tabela de pagamentos com suporte a planos fixos e personalizados';
