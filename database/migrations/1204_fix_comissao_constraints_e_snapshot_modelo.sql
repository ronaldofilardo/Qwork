-- ============================================================================
-- MIGRATION 1204: Fix constraints de comissão + modelo no lead
-- Descrição:
--   1. Adiciona coluna modelo_comissionamento em leads_representante
--      (snapshot do modelo vigente no momento da negociação do lead)
--   2. Adiciona constraint de soma rep + comercial <= 40 em representantes
--   3. Restaura constraint de soma rep + comercial <= 40 em vinculos_comissao
--      (foi removida em 1133 junto com vendedor, nunca recriada para comercial)
-- Data: 2026-04-30
-- Segurança: 100% idempotente (IF NOT EXISTS / DROP IF EXISTS)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. leads_representante: snapshot do modelo do representante na negociação
-- ============================================================================

ALTER TABLE leads_representante
  ADD COLUMN IF NOT EXISTS modelo_comissionamento modelo_comissionamento;

COMMENT ON COLUMN leads_representante.modelo_comissionamento IS
  'Modelo de comissionamento vigente para o representante no momento da criação do lead (snapshot).';

-- ============================================================================
-- 2. representantes: constraint de soma rep + comercial <= 40
-- ============================================================================

ALTER TABLE representantes
  DROP CONSTRAINT IF EXISTS rep_comissao_total_max;

ALTER TABLE representantes
  ADD CONSTRAINT rep_comissao_total_max
    CHECK (
      COALESCE(percentual_comissao, 0) + COALESCE(percentual_comissao_comercial, 0) <= 40
    );

COMMENT ON CONSTRAINT rep_comissao_total_max ON representantes IS
  'Garante que a soma dos percentuais de comissão (rep + comercial) não ultrapasse 40%.';

-- ============================================================================
-- 3. vinculos_comissao: restaurar constraint de soma rep + comercial <= 40
--    (foi removida pela migration 1133 junto com percentual_comissao_vendedor)
-- ============================================================================

ALTER TABLE vinculos_comissao
  DROP CONSTRAINT IF EXISTS chk_vinculos_comissao_total_max;

ALTER TABLE vinculos_comissao
  ADD CONSTRAINT chk_vinculos_comissao_total_max
    CHECK (
      COALESCE(percentual_comissao_representante, 0) + COALESCE(percentual_comissao_comercial, 0) <= 40
    );

COMMENT ON CONSTRAINT chk_vinculos_comissao_total_max ON vinculos_comissao IS
  'Garante que a soma dos percentuais negociados no vínculo (rep + comercial) não ultrapasse 40%.';

COMMIT;
