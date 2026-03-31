-- Migration 1121: Split de comissão em vinculos_comissao
-- Propaga percentuais do lead para o vínculo quando convertido.

BEGIN;

-- 1. Adicionar colunas de comissão split
ALTER TABLE vinculos_comissao
  ADD COLUMN IF NOT EXISTS percentual_comissao_representante NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS percentual_comissao_vendedor NUMERIC(5,2) NOT NULL DEFAULT 0;

-- 2. Backfill: vínculos existentes que têm lead_id → copiar do lead
UPDATE vinculos_comissao vc
SET
  percentual_comissao_representante = COALESCE(lr.percentual_comissao_representante, lr.percentual_comissao, 0),
  percentual_comissao_vendedor = COALESCE(lr.percentual_comissao_vendedor, 0)
FROM leads_representante lr
WHERE vc.lead_id = lr.id
  AND vc.percentual_comissao_representante IS NULL;

-- 3. Backfill: vínculos sem lead → usar percentual global do representante
UPDATE vinculos_comissao vc
SET percentual_comissao_representante = COALESCE(r.percentual_comissao, 0)
FROM representantes r
WHERE vc.representante_id = r.id
  AND vc.percentual_comissao_representante IS NULL;

-- 4. Check constraints
ALTER TABLE vinculos_comissao
  ADD CONSTRAINT chk_vinculos_perc_rep_range
    CHECK (percentual_comissao_representante >= 0 AND percentual_comissao_representante <= 100);

ALTER TABLE vinculos_comissao
  ADD CONSTRAINT chk_vinculos_perc_vend_range
    CHECK (percentual_comissao_vendedor >= 0 AND percentual_comissao_vendedor <= 100);

ALTER TABLE vinculos_comissao
  ADD CONSTRAINT chk_vinculos_comissao_total_max
    CHECK (COALESCE(percentual_comissao_representante, 0) + percentual_comissao_vendedor <= 40);

-- 5. Comentários
COMMENT ON COLUMN vinculos_comissao.percentual_comissao_representante IS 'Percentual de comissão do representante neste vínculo (propagado do lead)';
COMMENT ON COLUMN vinculos_comissao.percentual_comissao_vendedor IS 'Percentual de comissão do vendedor neste vínculo (propagado do lead). 0 se venda direta.';

COMMIT;
