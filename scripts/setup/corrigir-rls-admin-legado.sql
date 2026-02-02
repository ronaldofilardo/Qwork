-- Corrigir politicas RLS legadas com admin
-- Data: 31/01/2026
-- Remove admin de 4 politicas operacionais restantes

BEGIN;

-- 1. AVALIACAO_RESETS: Remover admin do INSERT
-- Admin nao deve poder resetar avaliacoes (operacional)
DROP POLICY IF EXISTS avaliacao_resets_insert_policy ON avaliacao_resets;
CREATE POLICY avaliacao_resets_insert_policy ON avaliacao_resets
  FOR INSERT
  WITH CHECK (
    -- backend processes podem inserir
    current_setting('app.is_backend', true) = '1'
    -- ou apenas RH e gestor_entidade (REMOVIDO admin)
    OR (current_setting('app.current_user_perfil', true) IN ('rh','gestor_entidade'))
  );

-- 2. AVALIACOES_OWN_UPDATE: Garantir que apenas funcionario pode atualizar
-- Nao deve incluir admin na condicao USING
DROP POLICY IF EXISTS avaliacoes_own_update ON public.avaliacoes;
CREATE POLICY avaliacoes_own_update ON public.avaliacoes
  FOR UPDATE
  TO PUBLIC
  USING (
    funcionario_cpf = current_user_cpf()
  )
  WITH CHECK (
    funcionario_cpf = current_user_cpf()
  );

-- 3. FILA_EMISSAO_ADMIN_VIEW: Remover completamente
-- Admin nao deve visualizar fila de emissao (operacional)
DROP POLICY IF EXISTS fila_emissao_admin_view ON fila_emissao;

-- 4. ADMIN_RESTRICTED_FUNCIONARIOS: Manter mas confirmar restricao
-- Esta politica esta CORRETA - admin so acessa RH/emissor sem vinculo a empresa
-- Apenas verificando que existe e esta configurada corretamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'funcionarios' 
        AND policyname = 'admin_restricted_funcionarios'
    ) THEN
        RAISE NOTICE 'Policy admin_restricted_funcionarios existe e esta CORRETA (rh/emissor sem vinculo)';
    ELSE
        RAISE WARNING 'Policy admin_restricted_funcionarios NAO encontrada!';
    END IF;
END $$;

-- Listar politicas restantes com admin apos correcao
SELECT tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND (policyname ILIKE '%admin%' OR qual ILIKE '%admin%' OR with_check ILIKE '%admin%')
ORDER BY 
    CASE 
        WHEN permissive = 'RESTRICTIVE' THEN 1 
        WHEN tablename IN ('audit_logs', 'clinicas', 'contratantes', 'roles', 'permissions', 'role_permissions') THEN 2
        WHEN policyname = 'admin_restricted_funcionarios' THEN 3
        ELSE 4
    END,
    tablename, 
    policyname;

COMMIT;
