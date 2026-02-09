-- Migration: 605a_drop_dependencies_before_column_removal.sql
-- Descricao: Remove policies e views que dependem das colunas obsoletas de funcionarios
-- Data: 2026-02-08
-- Depende: 604_create_relationships_rls_policies.sql
-- CRITICO: Esta migration deve rodar ANTES de 605_remove_obsolete_fk_columns_from_funcionarios.sql

-- =============================================================================
-- PASSO 1: Dropar policies antigas que usam as colunas obsoletas
-- =============================================================================

-- Policies que referenciam clinica_id
DROP POLICY IF EXISTS resultados_rh_select ON resultados;
DROP POLICY IF EXISTS funcionarios_admin_rh_emissor_insert ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestorentidade_insert ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestorentidade_update ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestorentidade_select ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestorentidade_delete ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestorentidade_select_all ON funcionarios;
DROP POLICY IF EXISTS rh_funcionarios_empresas ON funcionarios;

-- Policy que referencia empresa_id
DROP POLICY IF EXISTS empresas_rh_delete ON empresas_clientes;

COMMENT ON TABLE funcionarios IS 'Policies antigas que usavam FKs diretas foram removidas';

-- =============================================================================
-- PASSO 2: Dropar views que usam as colunas obsoletas
-- =============================================================================

DROP VIEW IF EXISTS vw_comparativo_empresas CASCADE;

COMMENT ON TABLE empresas_clientes IS 'View vw_comparativo_empresas removida (usava empresa_id direta)';

-- =============================================================================
-- VALIDACAO
-- =============================================================================

DO $$
DECLARE
    v_policies_antigas INTEGER;
    v_views_antigas INTEGER;
BEGIN
    -- Contar policies restantes que usam as colunas obsoletas
    SELECT COUNT(*) INTO v_policies_antigas
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'funcionarios'
      AND (
          policyname LIKE '%clinica%'
          OR policyname LIKE '%empresa%'
          OR policyname LIKE '%entidade%'
      )
      AND policyname NOT LIKE '%via_relacionamento%'
      AND policyname NOT LIKE '%_base';
    
    IF v_policies_antigas > 0 THEN
        RAISE WARNING 'Ainda existem % policies antigas em funcionarios', v_policies_antigas;
    ELSE
        RAISE NOTICE 'Todas as policies antigas foram removidas';
    END IF;
    
    -- Verificar se view foi removida
    SELECT COUNT(*) INTO v_views_antigas
    FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name = 'vw_comparativo_empresas';
    
    IF v_views_antigas > 0 THEN
        RAISE EXCEPTION 'View vw_comparativo_empresas ainda existe';
    END IF;
    
    RAISE NOTICE 'Migration 605a: Dependencias removidas com sucesso';
END $$;
