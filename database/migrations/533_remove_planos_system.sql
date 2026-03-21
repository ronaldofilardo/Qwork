/**
 * Migration: 533_remove_planos_system.sql
 * Purpose: Complete removal of the legacy planos (plans) system
 * 
 * Context: The application previously supported two plan types (fixo and personalizado)
 * that were managed via the `planos` table and related structures. This functionality
 * has been entirely deprecated and removed from the codebase. This migration cleans up:
 * 
 * - `planos` table (plan definitions)
 * - `contratos_planos` table (contracts linked to plans)
 * - `historico_contratos_planos` table (historical contract tracking)
 * - `contratacao_personalizada` table (personnalized contract data)
 * - `auditoria_planos` table (audit logs for plans)
 * - `payment_links` table (deprecated payment link tracking)
 * - Related columns from `contratos`, `tomadores` tables
 * - The `tipo_plano` enum type
 * 
 * All foreign key references, triggers, and functions referencing these structures
 * are also removed.
 */

-- ============================================================================
-- DROP DEPENDENT VIEWS AND FUNCTIONS FIRST
-- ============================================================================

-- Drop views that reference planos-related tables
DROP VIEW IF EXISTS public.v_auditoria_emissoes CASCADE;
DROP VIEW IF EXISTS public.vw_solicitacoes_emissao_entidade CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mat_vw_recibos CASCADE;

-- Drop functions that reference planos
DROP FUNCTION IF EXISTS public.fn_validar_token_pagamento(character varying) CASCADE;

-- ============================================================================
-- DROP ALL FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Drop FK from auditoria_planos → planos
ALTER TABLE IF EXISTS public.auditoria_planos 
  DROP CONSTRAINT IF EXISTS auditoria_planos_plano_id_fkey CASCADE;

-- Drop FK from auditoria_planos → contratos_planos
ALTER TABLE IF EXISTS public.auditoria_planos 
  DROP CONSTRAINT IF EXISTS auditoria_planos_contrato_id_fkey CASCADE;

-- Drop FK from tomadores → planos
ALTER TABLE IF EXISTS public.tomadores 
  DROP CONSTRAINT IF EXISTS tomadores_plano_id_fkey CASCADE;

-- Drop FK from contratos → planos
ALTER TABLE IF EXISTS public.contratos 
  DROP CONSTRAINT IF EXISTS contratos_plano_id_fkey CASCADE;

-- Drop FK from contratos_planos → planos
ALTER TABLE IF EXISTS public.contratos_planos 
  DROP CONSTRAINT IF EXISTS contratos_planos_plano_id_fkey CASCADE;

-- Drop FK from contratos_planos → clinicas
ALTER TABLE IF EXISTS public.contratos_planos 
  DROP CONSTRAINT IF EXISTS contratos_planos_clinica_id_fkey CASCADE;

-- Drop FK from contratos_planos → tomadores
ALTER TABLE IF EXISTS public.contratos_planos 
  DROP CONSTRAINT IF EXISTS contratos_planos_contratante_id_fkey CASCADE;

-- Drop FK from historico_contratos_planos → contratos_planos
ALTER TABLE IF EXISTS public.historico_contratos_planos 
  DROP CONSTRAINT IF EXISTS historico_contratos_planos_contrato_id_fkey CASCADE;

-- Drop FK from payment_links → planos
ALTER TABLE IF EXISTS public.payment_links 
  DROP CONSTRAINT IF EXISTS fk_token_plano CASCADE;

-- Drop FK from notificacoes_financeiras → contratos_planos
ALTER TABLE IF EXISTS public.notificacoes_financeiras 
  DROP CONSTRAINT IF EXISTS notificacoes_financeiras_contrato_id_fkey CASCADE;

-- ============================================================================
-- DROP TRIGGERS ASSOCIATED WITH PLANOS TABLES
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_audit_contratos_planos_insert ON public.contratos_planos CASCADE;
DROP TRIGGER IF EXISTS trigger_audit_contratos_planos_update ON public.contratos_planos CASCADE;
DROP TRIGGER IF EXISTS trigger_audit_contratos_planos_delete ON public.contratos_planos CASCADE;
DROP TRIGGER IF EXISTS trigger_audit_auditoria_planos_insert ON public.auditoria_planos CASCADE;
DROP TRIGGER IF EXISTS trigger_audit_auditoria_planos_update ON public.auditoria_planos CASCADE;
DROP TRIGGER IF EXISTS trigger_audit_auditoria_planos_delete ON public.auditoria_planos CASCADE;

-- ============================================================================
-- DROP TABLES IN DEPENDENCY ORDER
-- ============================================================================

-- historico_contratos_planos depends on contratos_planos
DROP TABLE IF EXISTS public.historico_contratos_planos CASCADE;

-- auditoria_planos depends on contratos_planos and planos
DROP TABLE IF EXISTS public.auditoria_planos CASCADE;

-- contratacao_personalizada (no explicit FK, but semantically related)
DROP TABLE IF EXISTS public.contratacao_personalizada CASCADE;

-- contratos_planos depends on planos
DROP TABLE IF EXISTS public.contratos_planos CASCADE;

-- payment_links depends on planos
DROP TABLE IF EXISTS public.payment_links CASCADE;

-- planos (leaf table)
DROP TABLE IF EXISTS public.planos CASCADE;

-- ============================================================================
-- DROP COLUMNS FROM REMAINING TABLES
-- ============================================================================

-- Drop plano_id column from tomadores
ALTER TABLE public.tomadores
  DROP COLUMN IF EXISTS plano_id CASCADE,
  DROP COLUMN IF EXISTS plano_tipo CASCADE,
  DROP COLUMN IF EXISTS numero_funcionarios_estimado CASCADE,
  DROP COLUMN IF EXISTS pagamento_confirmado CASCADE,
  DROP COLUMN IF EXISTS data_liberacao_login CASCADE,
  DROP COLUMN IF EXISTS data_primeiro_pagamento CASCADE;

-- Drop plano_id and related columns from contratos
ALTER TABLE public.contratos
  DROP COLUMN IF EXISTS plano_id CASCADE,
  DROP COLUMN IF EXISTS valor_personalizado CASCADE,
  DROP COLUMN IF EXISTS payment_link_token CASCADE,
  DROP COLUMN IF EXISTS payment_link_expiracao CASCADE,
  DROP COLUMN IF EXISTS link_enviado_em CASCADE;

-- Drop if exists from clinicas (might have plan fields)
ALTER TABLE IF EXISTS public.clinicas
  DROP COLUMN IF EXISTS plano_personalizado_pendente CASCADE,
  DROP COLUMN IF EXISTS numero_funcionarios_estimado CASCADE;

-- ============================================================================
-- DROP ENUM TYPES
-- ============================================================================

-- Drop tipo_plano enum (values: 'fixo', 'personalizado')
DROP TYPE IF EXISTS public.tipo_plano CASCADE;

-- ============================================================================
-- DROP SEQUENCES
-- ============================================================================

DROP SEQUENCE IF EXISTS public.planos_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.contratos_planos_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.historico_contratos_planos_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.auditoria_planos_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.payment_links_id_seq CASCADE;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Verify all plano-related tables are dropped
DO $$
DECLARE
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND (
    table_name LIKE '%plano%' 
    OR table_name LIKE '%contratacao_personalizada%'
    OR table_name LIKE '%payment_link%'
  );
  
  IF table_count > 0 THEN
    RAISE WARNING 'Migration 533: % plano-related tables still found after cleanup', table_count;
  END IF;
END $$;

-- Log completion
INSERT INTO public.auditoria_sistema(usuario_cpf, acao, tabela, descricao, data) 
VALUES ('SYSTEM', 'MIGRATION_533', 'schema', 'Removed complete planos system and related tables', NOW())
ON CONFLICT DO NOTHING;
