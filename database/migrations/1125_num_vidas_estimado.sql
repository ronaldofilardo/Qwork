-- Migration 1125: Adicionar num_vidas_estimado em leads_representante e vinculos_comissao
-- Número estimado de vidas/funcionários do lead, informacional para contexto de volume.

-- 1. Coluna em leads_representante
ALTER TABLE leads_representante
  ADD COLUMN IF NOT EXISTS num_vidas_estimado INT DEFAULT NULL;

-- Check: se informado, deve ser > 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_leads_num_vidas_positivo'
  ) THEN
    ALTER TABLE leads_representante
      ADD CONSTRAINT chk_leads_num_vidas_positivo CHECK (num_vidas_estimado IS NULL OR num_vidas_estimado > 0);
  END IF;
END $$;

-- 2. Coluna em vinculos_comissao (propagada na conversão lead→vínculo)
ALTER TABLE vinculos_comissao
  ADD COLUMN IF NOT EXISTS num_vidas_estimado INT DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_vinculos_num_vidas_positivo'
  ) THEN
    ALTER TABLE vinculos_comissao
      ADD CONSTRAINT chk_vinculos_num_vidas_positivo CHECK (num_vidas_estimado IS NULL OR num_vidas_estimado > 0);
  END IF;
END $$;

-- 3. Backfill: propagar num_vidas dos leads convertidos para vínculos existentes
UPDATE vinculos_comissao vc
SET num_vidas_estimado = lr.num_vidas_estimado
FROM leads_representante lr
WHERE vc.lead_id = lr.id
  AND lr.num_vidas_estimado IS NOT NULL
  AND vc.num_vidas_estimado IS NULL;
