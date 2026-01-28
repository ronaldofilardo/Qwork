-- Migration: Adicionar coluna parcela_numero na tabela recibos
-- Data: 2026-01-19
-- Descrição: Permite associar cada recibo a uma parcela específica

ALTER TABLE recibos 
ADD COLUMN IF NOT EXISTS parcela_numero INTEGER;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_recibos_parcela_numero ON recibos (parcela_numero);
CREATE INDEX IF NOT EXISTS idx_recibos_pagamento_parcela ON recibos (pagamento_id, parcela_numero);

-- Comentário
COMMENT ON COLUMN recibos.parcela_numero IS 'Número da parcela associada ao recibo (1, 2, 3...)';
