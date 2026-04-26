-- ============================================================================
-- MIGRATION 608: Adicionar comercial_cpf em representantes_cadastro_leads
-- Descrição: Vincula leads da landing page a um comercial específico.
--            Todos os leads vindos da LP são atribuídos ao comercial padrão.
-- Data: 2026-04-26
-- ============================================================================

BEGIN;

-- 1. Adicionar coluna comercial_cpf (nullable para compatibilidade retroativa)
ALTER TABLE public.representantes_cadastro_leads
  ADD COLUMN IF NOT EXISTS comercial_cpf CHAR(11) DEFAULT NULL;

-- 2. Índice para queries de listagem por comercial + status
CREATE INDEX IF NOT EXISTS idx_cadastro_leads_comercial_status
  ON public.representantes_cadastro_leads (comercial_cpf, status);

COMMIT;
