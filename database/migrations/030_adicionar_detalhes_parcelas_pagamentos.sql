-- Migration 030: Adicionar coluna detalhes_parcelas na tabela pagamentos
-- Descrição: Permite armazenar JSON com detalhamento das parcelas de um pagamento

ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS detalhes_parcelas JSONB;

COMMENT ON COLUMN pagamentos.detalhes_parcelas IS 'detalhes das parcelas em JSON: [{numero, valor, data_vencimento, pago, data_pagamento}]';

RAISE NOTICE 'Migration 030 executada com sucesso: coluna detalhes_parcelas adicionada à tabela pagamentos';
