-- Migração 026: Adicionar campos completos de pagamento e parcelamento
-- Data: 2025-12-21
-- Objetivo: Registrar valor pago, tipo de pagamento, modalidade e detalhes de parcelas

-- Adicionar campos de pagamento em contratos_planos
ALTER TABLE contratos_planos 
ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS tipo_pagamento VARCHAR(20) CHECK (tipo_pagamento IN ('boleto', 'cartao', 'pix', NULL)),
ADD COLUMN IF NOT EXISTS modalidade_pagamento VARCHAR(20) CHECK (modalidade_pagamento IN ('a_vista', 'parcelado', NULL)),
ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMP,
ADD COLUMN IF NOT EXISTS parcelas_json JSONB;

-- Comentários para documentação
COMMENT ON COLUMN contratos_planos.valor_pago IS 'Valor efetivamente pago pelo contratante';
COMMENT ON COLUMN contratos_planos.tipo_pagamento IS 'Tipo de pagamento utilizado: boleto, cartao ou pix';
COMMENT ON COLUMN contratos_planos.modalidade_pagamento IS 'Modalidade: a_vista ou parcelado';
COMMENT ON COLUMN contratos_planos.data_pagamento IS 'Data do primeiro pagamento';
COMMENT ON COLUMN contratos_planos.parcelas_json IS 'Detalhes das parcelas em JSON: [{numero, valor, data_vencimento, pago, data_pagamento}]';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contratos_tipo_pagamento ON contratos_planos(tipo_pagamento);
CREATE INDEX IF NOT EXISTS idx_contratos_modalidade_pagamento ON contratos_planos(modalidade_pagamento);
CREATE INDEX IF NOT EXISTS idx_contratos_data_pagamento ON contratos_planos(data_pagamento);

-- Função para validar estrutura de parcelas JSON
CREATE OR REPLACE FUNCTION validar_parcelas_json()
RETURNS TRIGGER AS $$
BEGIN
    -- Se há parcelas_json, validar estrutura
    IF NEW.parcelas_json IS NOT NULL THEN
        -- Verificar se é um array
        IF jsonb_typeof(NEW.parcelas_json) != 'array' THEN
            RAISE EXCEPTION 'parcelas_json deve ser um array';
        END IF;
        
        -- Se parcelado, deve ter parcelas
        IF NEW.modalidade_pagamento = 'parcelado' AND jsonb_array_length(NEW.parcelas_json) < 2 THEN
            RAISE EXCEPTION 'Pagamento parcelado deve ter pelo menos 2 parcelas';
        END IF;
        
        -- Validar que numero_parcelas coincide com tamanho do array
        IF NEW.numero_parcelas IS NOT NULL AND NEW.numero_parcelas != jsonb_array_length(NEW.parcelas_json) THEN
            RAISE EXCEPTION 'numero_parcelas deve coincidir com quantidade de parcelas em parcelas_json';
        END IF;
    END IF;
    
    -- Se modalidade é parcelado, deve ter parcelas_json
    IF NEW.modalidade_pagamento = 'parcelado' AND NEW.parcelas_json IS NULL THEN
        RAISE EXCEPTION 'Pagamento parcelado deve conter detalhes das parcelas em parcelas_json';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validação
DROP TRIGGER IF EXISTS trg_validar_parcelas ON contratos_planos;
CREATE TRIGGER trg_validar_parcelas
BEFORE INSERT OR UPDATE ON contratos_planos
FOR EACH ROW
EXECUTE FUNCTION validar_parcelas_json();

-- Auditoria: adicionar eventos de pagamento
INSERT INTO tipos_auditoria (codigo, nome, descricao)
VALUES 
    ('pagamento_registrado', 'Pagamento Registrado', 'Registro de pagamento de contrato'),
    ('pagamento_parcelado', 'Pagamento Parcelado', 'Registro de pagamento parcelado'),
    ('parcela_paga', 'Parcela Paga', 'Registro de pagamento de parcela individual')
ON CONFLICT (codigo) DO NOTHING;
