-- Migration 028: Adicionar campo numero_parcelas na tabela pagamentos
-- Data: 2025-12-21
-- Descrição: Permite registrar número de parcelas para boleto e cartão

-- Adicionar coluna numero_parcelas
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS numero_parcelas INTEGER DEFAULT 1;

-- Adicionar constraint para validar parcelas (1 a 12)
ALTER TABLE pagamentos 
ADD CONSTRAINT check_numero_parcelas 
CHECK (numero_parcelas >= 1 AND numero_parcelas <= 12);

-- Comentário explicativo
COMMENT ON COLUMN pagamentos.numero_parcelas IS 'Número de parcelas do pagamento (1 = à vista, 2-12 = parcelado)';

-- Índice para consultas de pagamentos parcelados
CREATE INDEX IF NOT EXISTS idx_pagamentos_parcelas 
ON pagamentos (numero_parcelas) 
WHERE numero_parcelas > 1;

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Migration 028 executada com sucesso: coluna numero_parcelas adicionada à tabela pagamentos';
END $$;
