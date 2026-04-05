-- Migration 201 (Neon) - APENAS RLS (sem tomadores_funcionarios)
-- Data: 2026-01-29

BEGIN;

\echo '=== MIGRATION 201 (NEON): Refatorar RLS para usuario_tipo'

-- 1. Remover políticas RLS antigas (se existirem)
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

\echo '   ✓ Políticas antigas removidas'

-- 2. Criar funções auxiliares para RLS
CREATE OR REPLACE FUNCTION current_user_is_gestor()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.current_user_perfil', TRUE) = 'gestor',
    FALSE
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION current_user_is_gestor() IS 
  'Verifica se o usuário atual é gestor de entidade (baseado em app.current_user_perfil)';

\echo '   ✓ Funções auxiliares criadas'

-- 3. Criar políticas RLS unificadas usando usuario_tipo
CREATE POLICY funcionarios_select_unified ON funcionarios
  FOR SELECT
  USING (
    -- Admin vê tudo
    current_user_perfil() = 'admin'
    OR
    -- Funcionário vê apenas próprio registro
    (current_user_perfil() = 'funcionario' AND current_user_cpf() = cpf)
    OR
    -- RH vê funcionários da mesma clínica ou entidade
    (current_user_perfil() = 'rh' AND (
      -- Funcionários da mesma clínica (via empresas ou clinicas)
      EXISTS (
        SELECT 1 FROM empresas e
        WHERE e.id = funcionarios.empresa_id
        AND e.contratante_id IN (
          SELECT DISTINCT contratante_id FROM empresas e2
          JOIN funcionarios f2 ON f2.empresa_id = e2.id
          WHERE f2.cpf = current_user_cpf() = cpf
          AND f2.usuario_tipo = 'rh'
        )
      )
      OR
      EXISTS (
        SELECT 1 FROM clinicas cl
        WHERE cl.id = funcionarios.clinica_id
        AND cl.contratante_id IN (
          SELECT DISTINCT c2.contratante_id FROM clinicas c2
          JOIN funcionarios f2 ON f2.clinica_id = c2.id
          WHERE f2.cpf = current_user_cpf() = cpf
          AND f2.usuario_tipo = 'rh'
        )
      )
      OR
      -- Funcionários da mesma entidade (vínculo direto)
      (contratante_id IS NOT NULL AND contratante_id IN (
        SELECT DISTINCT contratante_id FROM funcionarios f3
        WHERE f3.cpf = current_user_cpf() = cpf
        AND f3.usuario_tipo = 'rh'
        AND f3.contratante_id IS NOT NULL
      ))
    ))
    OR
    -- Gestor de entidade vê funcionários da mesma entidade
    (current_user_perfil() = 'gestor' AND (
      contratante_id = (
        SELECT contratante_id FROM funcionarios f4
        WHERE f4.cpf = current_user_cpf() = cpf
        AND f4.usuario_tipo = 'gestor'
        LIMIT 1
      )
    ))
  );

COMMENT ON POLICY funcionarios_select_unified ON funcionarios IS 
  'Política unificada SELECT: Admin (tudo), Funcionário (próprio), RH (mesma clínica/entidade), Gestor Entidade (mesma entidade)';

CREATE POLICY funcionarios_update_unified ON funcionarios
  FOR UPDATE
  USING (
    -- Admin pode atualizar tudo
    current_user_perfil() = 'admin'
    OR
    -- RH pode atualizar funcionários da mesma clínica/entidade
    (current_user_perfil() = 'rh' AND (
      EXISTS (
        SELECT 1 FROM empresas e
        WHERE e.id = funcionarios.empresa_id
        AND e.contratante_id IN (
          SELECT DISTINCT contratante_id FROM empresas e2
          JOIN funcionarios f2 ON f2.empresa_id = e2.id
          WHERE f2.cpf = current_user_cpf() = cpf
          AND f2.usuario_tipo = 'rh'
        )
      )
      OR
      EXISTS (
        SELECT 1 FROM clinicas cl
        WHERE cl.id = funcionarios.clinica_id
        AND cl.contratante_id IN (
          SELECT DISTINCT c2.contratante_id FROM clinicas c2
          JOIN funcionarios f2 ON f2.clinica_id = c2.id
          WHERE f2.cpf = current_user_cpf() = cpf
          AND f2.usuario_tipo = 'rh'
        )
      )
      OR
      (contratante_id IS NOT NULL AND contratante_id IN (
        SELECT DISTINCT contratante_id FROM funcionarios f3
        WHERE f3.cpf = current_user_cpf() = cpf
        AND f3.usuario_tipo = 'rh'
        AND f3.contratante_id IS NOT NULL
      ))
    ))
    OR
    -- Gestor entidade pode atualizar funcionários da mesma entidade
    (current_user_perfil() = 'gestor' AND (
      contratante_id = (
        SELECT contratante_id FROM funcionarios f4
        WHERE f4.cpf = current_user_cpf() = cpf
        AND f4.usuario_tipo = 'gestor'
        LIMIT 1
      )
    ))
  );

COMMENT ON POLICY funcionarios_update_unified ON funcionarios IS 
  'Política unificada UPDATE: Admin (tudo), RH (mesma clínica/entidade), Gestor Entidade (mesma entidade)';

CREATE POLICY funcionarios_insert_unified ON funcionarios
  FOR INSERT
  WITH CHECK (
    -- Admin pode inserir tudo
    current_user_perfil() = 'admin'
    OR
    -- RH pode inserir funcionários na mesma clínica/entidade
    (current_user_perfil() = 'rh' AND (
      EXISTS (
        SELECT 1 FROM empresas e
        WHERE e.id = funcionarios.empresa_id
        AND e.contratante_id IN (
          SELECT DISTINCT contratante_id FROM empresas e2
          JOIN funcionarios f2 ON f2.empresa_id = e2.id
          WHERE f2.cpf = current_user_cpf() = cpf
          AND f2.usuario_tipo = 'rh'
        )
      )
      OR
      EXISTS (
        SELECT 1 FROM clinicas cl
        WHERE cl.id = funcionarios.clinica_id
        AND cl.contratante_id IN (
          SELECT DISTINCT c2.contratante_id FROM clinicas c2
          JOIN funcionarios f2 ON f2.clinica_id = c2.id
          WHERE f2.cpf = current_user_cpf() = cpf
          AND f2.usuario_tipo = 'rh'
        )
      )
      OR
      (contratante_id IS NOT NULL AND contratante_id IN (
        SELECT DISTINCT contratante_id FROM funcionarios f3
        WHERE f3.cpf = current_user_cpf() = cpf
        AND f3.usuario_tipo = 'rh'
        AND f3.contratante_id IS NOT NULL
      ))
    ))
    OR
    -- Gestor entidade pode inserir funcionários na mesma entidade
    (current_user_perfil() = 'gestor' AND (
      contratante_id = (
        SELECT contratante_id FROM funcionarios f4
        WHERE f4.cpf = current_user_cpf() = cpf
        AND f4.usuario_tipo = 'gestor'
        LIMIT 1
      )
    ))
  );

COMMENT ON POLICY funcionarios_insert_unified ON funcionarios IS 
  'Política unificada INSERT: Admin (tudo), RH (mesma clínica/entidade), Gestor Entidade (mesma entidade)';

CREATE POLICY funcionarios_delete_unified ON funcionarios
  FOR DELETE
  USING (
    -- Apenas admin pode deletar
    current_user_perfil() = 'admin'
  );

COMMENT ON POLICY funcionarios_delete_unified ON funcionarios IS 
  'Política unificada DELETE: Apenas Admin';

\echo '   ✓ Políticas RLS unificadas criadas'

COMMIT;

\echo '=== MIGRATION 201 (NEON) CONCLUÍDA COM SUCESSO'

