-- ============================================================================
-- MIGRATION 601: Remover campos legados de comissão de vendedor + walletId
-- Descrição: Remove colunas de comissão de vendedor que não fazem parte
--            do novo modelo. O walletId já foi adicionado na Migration 600.
-- Data: 2026-04-12
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. REMOVER percentual_override de hierarquia_comercial
--    (comissão de vendedor não faz mais parte do modelo)
-- ============================================================================

ALTER TABLE public.hierarquia_comercial
  DROP COLUMN IF EXISTS percentual_override;

-- ============================================================================
-- 2. REMOVER percentual_vendedor_direto de representantes
--    (adicionado na Migration 1111, removido no novo modelo)
-- ============================================================================

ALTER TABLE public.representantes
  DROP COLUMN IF EXISTS percentual_vendedor_direto;

-- ============================================================================
-- 3. REMOVER percentual_comissao_vendedor de leads_representante
--    (caso ainda exista — algumas migrations anteriores podem não ter aplicado)
-- ============================================================================

ALTER TABLE public.leads_representante
  DROP COLUMN IF EXISTS percentual_comissao_vendedor;

-- ============================================================================
-- 4. REMOVER percentual_comissao_vendedor de vinculos_comissao
--    (caso ainda exista)
-- ============================================================================

ALTER TABLE public.vinculos_comissao
  DROP COLUMN IF EXISTS percentual_comissao_vendedor;

COMMIT;
