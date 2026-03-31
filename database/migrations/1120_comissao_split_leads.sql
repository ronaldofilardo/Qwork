-- Migration 1120: Split de comissão em leads_representante
-- Adiciona percentual_comissao_representante e percentual_comissao_vendedor
-- O campo existente percentual_comissao é mantido como alias legado (= perc_rep).
-- Backfill: dados existentes → percentual_comissao_representante = percentual_comissao

BEGIN;

-- 1. Adicionar coluna de comissão do representante (backfill de dados existentes)
ALTER TABLE leads_representante
  ADD COLUMN IF NOT EXISTS percentual_comissao_representante NUMERIC(5,2);

-- 2. Adicionar coluna de comissão do vendedor (default 0 para leads sem vendedor)
ALTER TABLE leads_representante
  ADD COLUMN IF NOT EXISTS percentual_comissao_vendedor NUMERIC(5,2) NOT NULL DEFAULT 0;

-- 3. Backfill: copiar percentual_comissao existente para percentual_comissao_representante
UPDATE leads_representante
SET percentual_comissao_representante = COALESCE(percentual_comissao, 0)
WHERE percentual_comissao_representante IS NULL;

-- 4. Adicionar check constraints
ALTER TABLE leads_representante
  ADD CONSTRAINT chk_leads_perc_rep_range
    CHECK (percentual_comissao_representante >= 0 AND percentual_comissao_representante <= 100);

ALTER TABLE leads_representante
  ADD CONSTRAINT chk_leads_perc_vend_range
    CHECK (percentual_comissao_vendedor >= 0 AND percentual_comissao_vendedor <= 100);

-- 5. Constraint: soma das comissões ≤ 40%
ALTER TABLE leads_representante
  ADD CONSTRAINT chk_leads_comissao_total_max
    CHECK (COALESCE(percentual_comissao_representante, 0) + percentual_comissao_vendedor <= 40);

-- 6. Comentários para documentação
COMMENT ON COLUMN leads_representante.percentual_comissao IS 'DEPRECADO: usar percentual_comissao_representante. Mantido para backward compat.';
COMMENT ON COLUMN leads_representante.percentual_comissao_representante IS 'Percentual de comissão do representante para este lead (0-40%)';
COMMENT ON COLUMN leads_representante.percentual_comissao_vendedor IS 'Percentual de comissão do vendedor para este lead (0-40%). Default 0 quando rep vende direto.';

COMMIT;
