-- Migration: 604_create_relationships_rls_policies.sql
-- Descricao: Cria RLS policies para tabelas intermediarias (funcionarios_entidades e funcionarios_clinicas)
-- Data: 2026-02-08
-- Depende: 600_create_funcionarios_relationships.sql, 603_recreate_funcionarios_views.sql

-- =============================================================================
-- HABILITAR RLS nas tabelas intermediarias
-- =============================================================================

ALTER TABLE funcionarios_entidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios_clinicas ENABLE ROW LEVEL SECURITY;

RAISE NOTICE 'RLS habilitado em funcionarios_entidades e funcionarios_clinicas';

-- =============================================================================
-- POLICIES para funcionarios_entidades (GESTOR)
-- =============================================================================

-- Bloquear admin de acessar direto (RESTRICTIVE)
CREATE POLICY funcionarios_entidades_block_admin 
    ON funcionarios_entidades AS RESTRICTIVE
    USING (current_user_perfil() <> 'admin');

-- Gestor pode SELECT, INSERT, UPDATE, DELETE funcionarios da sua entidade
CREATE POLICY funcionarios_entidades_gestor_select 
    ON funcionarios_entidades FOR SELECT
    USING (
        current_user_perfil() = 'gestor' AND
        entidade_id = current_user_entidade_id()
    );

CREATE POLICY funcionarios_entidades_gestor_insert 
    ON funcionarios_entidades FOR INSERT
    WITH CHECK (
        current_user_perfil() = 'gestor' AND
        entidade_id = current_user_entidade_id()
    );

CREATE POLICY funcionarios_entidades_gestor_update 
    ON funcionarios_entidades FOR UPDATE
    USING (
        current_user_perfil() = 'gestor' AND
        entidade_id = current_user_entidade_id()
    )
    WITH CHECK (
        current_user_perfil() = 'gestor' AND
        entidade_id = current_user_entidade_id()
    );

CREATE POLICY funcionarios_entidades_gestor_delete 
    ON funcionarios_entidades FOR DELETE
    USING (
        current_user_perfil() = 'gestor' AND
        entidade_id = current_user_entidade_id()
    );

COMMENT ON POLICY funcionarios_entidades_gestor_select ON funcionarios_entidades IS 
'Gestor pode visualizar relacionamentos de funcionarios da sua entidade';

COMMENT ON POLICY funcionarios_entidades_gestor_insert ON funcionarios_entidades IS 
'Gestor pode criar relacionamentos de funcionarios com sua entidade';

-- =============================================================================
-- POLICIES para funcionarios_clinicas (RH)
-- =============================================================================

-- Bloquear admin de acessar direto (RESTRICTIVE)
CREATE POLICY funcionarios_clinicas_block_admin 
    ON funcionarios_clinicas AS RESTRICTIVE
    USING (current_user_perfil() <> 'admin');

-- RH pode SELECT, INSERT, UPDATE, DELETE funcionarios da sua clinica
CREATE POLICY funcionarios_clinicas_rh_select 
    ON funcionarios_clinicas FOR SELECT
    USING (
        current_user_perfil() = 'rh' AND
        validate_rh_clinica() AND
        clinica_id = current_user_clinica_id_optional()
    );

CREATE POLICY funcionarios_clinicas_rh_insert 
    ON funcionarios_clinicas FOR INSERT
    WITH CHECK (
        current_user_perfil() = 'rh' AND
        validate_rh_clinica() AND
        clinica_id = current_user_clinica_id_optional()
    );

CREATE POLICY funcionarios_clinicas_rh_update 
    ON funcionarios_clinicas FOR UPDATE
    USING (
        current_user_perfil() = 'rh' AND
        validate_rh_clinica() AND
        clinica_id = current_user_clinica_id_optional()
    )
    WITH CHECK (
        current_user_perfil() = 'rh' AND
        validate_rh_clinica() AND
        clinica_id = current_user_clinica_id_optional()
    );

CREATE POLICY funcionarios_clinicas_rh_delete 
    ON funcionarios_clinicas FOR DELETE
    USING (
        current_user_perfil() = 'rh' AND
        validate_rh_clinica() AND
        clinica_id = current_user_clinica_id_optional()
    );

COMMENT ON POLICY funcionarios_clinicas_rh_select ON funcionarios_clinicas IS 
'RH pode visualizar relacionamentos de funcionarios da sua clinica';

COMMENT ON POLICY funcionarios_clinicas_rh_insert ON funcionarios_clinicas IS 
'RH pode criar relacionamentos de funcionarios com empresas da sua clinica';

-- =============================================================================
-- ATUALIZAR POLICIES de funcionarios para usar tabelas intermediarias
-- =============================================================================

-- Dropar policies antigas que usam FKs diretas
DROP POLICY IF EXISTS funcionarios_rh_select ON funcionarios;
DROP POLICY IF EXISTS funcionarios_rh_insert ON funcionarios;
DROP POLICY IF EXISTS funcionarios_rh_update ON funcionarios;
DROP POLICY IF EXISTS funcionarios_rh_delete ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestor_select ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestor_insert ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestor_update ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestor_delete ON funcionarios;

RAISE NOTICE 'Policies antigas de funcionarios removidas';

-- RH pode SELECT funcionarios via funcionarios_clinicas
CREATE POLICY funcionarios_rh_select_via_relacionamento 
    ON funcionarios FOR SELECT
    USING (
        current_user_perfil() = 'rh' AND
        validate_rh_clinica() AND
        EXISTS (
            SELECT 1 FROM funcionarios_clinicas fc
            WHERE fc.funcionario_id = funcionarios.id
              AND fc.clinica_id = current_user_clinica_id_optional()
              AND fc.ativo = true
        )
    );

-- RH pode INSERT funcionarios (mas vinculo eh feito em funcionarios_clinicas)
CREATE POLICY funcionarios_rh_insert_base 
    ON funcionarios FOR INSERT
    WITH CHECK (
        current_user_perfil() = 'rh' AND
        perfil = 'funcionario'
    );

-- RH pode UPDATE funcionarios via funcionarios_clinicas
CREATE POLICY funcionarios_rh_update_via_relacionamento 
    ON funcionarios FOR UPDATE
    USING (
        current_user_perfil() = 'rh' AND
        validate_rh_clinica() AND
        EXISTS (
            SELECT 1 FROM funcionarios_clinicas fc
            WHERE fc.funcionario_id = funcionarios.id
              AND fc.clinica_id = current_user_clinica_id_optional()
              AND fc.ativo = true
        )
    )
    WITH CHECK (
        perfil = 'funcionario'
    );

-- RH pode DELETE funcionarios via funcionarios_clinicas
CREATE POLICY funcionarios_rh_delete_via_relacionamento 
    ON funcionarios FOR DELETE
    USING (
        current_user_perfil() = 'rh' AND
        validate_rh_clinica() AND
        EXISTS (
            SELECT 1 FROM funcionarios_clinicas fc
            WHERE fc.funcionario_id = funcionarios.id
              AND fc.clinica_id = current_user_clinica_id_optional()
              AND fc.ativo = true
        )
    );

-- Gestor pode SELECT funcionarios via funcionarios_entidades
CREATE POLICY funcionarios_gestor_select_via_relacionamento 
    ON funcionarios FOR SELECT
    USING (
        current_user_perfil() = 'gestor' AND
        EXISTS (
            SELECT 1 FROM funcionarios_entidades fe
            WHERE fe.funcionario_id = funcionarios.id
              AND fe.entidade_id = current_user_entidade_id()
              AND fe.ativo = true
        )
    );

-- Gestor pode INSERT funcionarios (mas vinculo eh feito em funcionarios_entidades)
CREATE POLICY funcionarios_gestor_insert_base 
    ON funcionarios FOR INSERT
    WITH CHECK (
        current_user_perfil() = 'gestor' AND
        perfil = 'funcionario'
    );

-- Gestor pode UPDATE funcionarios via funcionarios_entidades
CREATE POLICY funcionarios_gestor_update_via_relacionamento 
    ON funcionarios FOR UPDATE
    USING (
        current_user_perfil() = 'gestor' AND
        EXISTS (
            SELECT 1 FROM funcionarios_entidades fe
            WHERE fe.funcionario_id = funcionarios.id
              AND fe.entidade_id = current_user_entidade_id()
              AND fe.ativo = true
        )
    )
    WITH CHECK (
        perfil = 'funcionario'
    );

-- Gestor pode DELETE funcionarios via funcionarios_entidades
CREATE POLICY funcionarios_gestor_delete_via_relacionamento 
    ON funcionarios FOR DELETE
    USING (
        current_user_perfil() = 'gestor' AND
        EXISTS (
            SELECT 1 FROM funcionarios_entidades fe
            WHERE fe.funcionario_id = funcionarios.id
              AND fe.entidade_id = current_user_entidade_id()
              AND fe.ativo = true
        )
    );

COMMENT ON POLICY funcionarios_rh_select_via_relacionamento ON funcionarios IS 
'RH pode visualizar funcionarios vinculados a sua clinica via funcionarios_clinicas';

COMMENT ON POLICY funcionarios_gestor_select_via_relacionamento ON funcionarios IS 
'Gestor pode visualizar funcionarios vinculados a sua entidade via funcionarios_entidades';

-- =============================================================================
-- VALIDACAO FINAL
-- =============================================================================

DO $$
DECLARE
    v_policies_entidades INTEGER;
    v_policies_clinicas INTEGER;
    v_policies_funcionarios INTEGER;
BEGIN
    -- Contar policies criadas
    SELECT COUNT(*) INTO v_policies_entidades
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'funcionarios_entidades';
    
    SELECT COUNT(*) INTO v_policies_clinicas
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'funcionarios_clinicas';
    
    SELECT COUNT(*) INTO v_policies_funcionarios
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'funcionarios'
      AND policyname LIKE '%via_relacionamento%';
    
    RAISE NOTICE 'Migration 604: RLS Policies criadas';
    RAISE NOTICE 'Policies em funcionarios_entidades: %', v_policies_entidades;
    RAISE NOTICE 'Policies em funcionarios_clinicas: %', v_policies_clinicas;
    RAISE NOTICE 'Policies em funcionarios (via relacionamentos): %', v_policies_funcionarios;
    
    IF v_policies_entidades < 5 THEN
        RAISE WARNING 'Esperadas pelo menos 5 policies em funcionarios_entidades';
    END IF;
    
    IF v_policies_clinicas < 5 THEN
        RAISE WARNING 'Esperadas pelo menos 5 policies em funcionarios_clinicas';
    END IF;
END $$;
