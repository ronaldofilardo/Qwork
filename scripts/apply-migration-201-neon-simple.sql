-- Migration 201 (Neon) - RLS Simplificado
-- Data: 2026-01-29
-- Usa apenas funções existentes no Neon: current_user_cpf(), current_user_perfil()

BEGIN;

\echo '=== MIGRATION 201 (NEON): RLS Simplificado'

-- 1. Remover políticas antigas
DROP POLICY IF EXISTS funcionarios_select_policy ON funcionarios;
DROP POLICY IF EXISTS funcionarios_update_policy ON funcionarios;
DROP POLICY IF EXISTS funcionarios_insert_policy ON funcionarios;
DROP POLICY IF EXISTS funcionarios_delete_policy ON funcionarios;
DROP POLICY IF EXISTS funcionarios_own_clinica ON funcionarios;
DROP POLICY IF EXISTS funcionarios_own_entidade ON funcionarios;
DROP POLICY IF EXISTS funcionarios_rh_clinica ON funcionarios;
DROP POLICY IF EXISTS funcionarios_rh_all ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestor_own ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestor ON funcionarios;
DROP POLICY IF EXISTS admin_all_funcionarios ON funcionarios;
DROP POLICY IF EXISTS funcionarios_select_unified ON funcionarios;
DROP POLICY IF EXISTS funcionarios_update_unified ON funcionarios;
DROP POLICY IF EXISTS funcionarios_insert_unified ON funcionarios;
DROP POLICY IF EXISTS funcionarios_delete_unified ON funcionarios;

\echo '   ✓ Políticas antigas removidas'

-- 2. Criar políticas simples baseadas em perfil
CREATE POLICY funcionarios_select_simple ON funcionarios
  FOR SELECT
  USING (
    -- Admin vê tudo
    current_user_perfil() = 'admin'
    OR
    -- Funcionário vê apenas próprio registro
    (current_user_perfil() = 'funcionario' AND cpf = current_user_cpf())
    OR
    -- RH vê funcionários da mesma clínica (simplificado)
    current_user_perfil() = 'rh'
    OR
    -- Gestor entidade vê funcionários (simplificado)
    current_user_perfil() = 'gestor'
  );

COMMENT ON POLICY funcionarios_select_simple ON funcionarios IS 
  'Política SELECT simplificada - Admin (tudo), Funcionário (próprio), RH/Gestor (amplo)';

CREATE POLICY funcionarios_update_simple ON funcionarios
  FOR UPDATE
  USING (
    -- Admin pode atualizar tudo
    current_user_perfil() = 'admin'
    OR
    -- RH pode atualizar
    current_user_perfil() = 'rh'
    OR
    -- Gestor entidade pode atualizar
    current_user_perfil() = 'gestor'
  );

COMMENT ON POLICY funcionarios_update_simple ON funcionarios IS 
  'Política UPDATE simplificada - Admin, RH e Gestor podem atualizar';

CREATE POLICY funcionarios_insert_simple ON funcionarios
  FOR INSERT
  WITH CHECK (
    -- Admin pode inserir tudo
    current_user_perfil() = 'admin'
    OR
    -- RH pode inserir
    current_user_perfil() = 'rh'
    OR
    -- Gestor entidade pode inserir
    current_user_perfil() = 'gestor'
  );

COMMENT ON POLICY funcionarios_insert_simple ON funcionarios IS 
  'Política INSERT simplificada - Admin, RH e Gestor podem inserir';

CREATE POLICY funcionarios_delete_simple ON funcionarios
  FOR DELETE
  USING (
    -- Apenas admin pode deletar
    current_user_perfil() = 'admin'
  );

COMMENT ON POLICY funcionarios_delete_simple ON funcionarios IS 
  'Política DELETE simplificada - Apenas Admin';

\echo '   ✓ Políticas RLS simplificadas criadas'

COMMIT;

\echo '=== MIGRATION 201 (NEON) CONCLUÍDA ✓'
\echo 'NOTA: Políticas RLS simplificadas aplicadas (sem contratantes_funcionarios)'
