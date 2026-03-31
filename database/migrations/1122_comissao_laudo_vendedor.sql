-- Migration 1122: Suporte a vendedor em comissoes_laudo
-- Linhas separadas: rep row (vendedor_id IS NULL), vendedor row (vendedor_id IS NOT NULL)
-- Renomeia semanticamente percentual_comissao → usa como percentual aplicado (rep ou vendedor)

BEGIN;

-- 1. Adicionar vendedor_id (FK para usuarios — vendedor_id armazena usuarios.id do vendedor)
ALTER TABLE comissoes_laudo
  ADD COLUMN IF NOT EXISTS vendedor_id INTEGER;

-- 2. Adicionar tipo_beneficiario para facilitar queries
ALTER TABLE comissoes_laudo
  ADD COLUMN IF NOT EXISTS tipo_beneficiario VARCHAR(20) NOT NULL DEFAULT 'representante'
    CHECK (tipo_beneficiario IN ('representante', 'vendedor'));

-- 3. Backfill: todas as comissões existentes são de representantes
UPDATE comissoes_laudo
SET tipo_beneficiario = 'representante'
WHERE tipo_beneficiario IS NULL OR tipo_beneficiario = '';

-- 4. Índice parcial para evitar duplicatas de comissão por beneficiário
CREATE UNIQUE INDEX IF NOT EXISTS idx_comissoes_laudo_lote_parcela_beneficiario
  ON comissoes_laudo (lote_pagamento_id, parcela_numero, tipo_beneficiario)
  WHERE lote_pagamento_id IS NOT NULL;

-- 5. Comentários
COMMENT ON COLUMN comissoes_laudo.vendedor_id IS 'ID do vendedor (usuarios.id) quando tipo_beneficiario=vendedor. NULL para comissões do representante.';
COMMENT ON COLUMN comissoes_laudo.tipo_beneficiario IS 'representante ou vendedor. Determina quem recebe esta comissão.';

COMMIT;
