-- Migration: Atualizar RLS Policies para Excluir Gestores
-- Data: 01/02/2026
-- Objetivo: Gestores (RH e Entidade) não devem usar RLS
-- Eles são validados via contratantes_senhas, não funcionarios

BEGIN;

-- ============================================
-- CONTEXTO E JUSTIFICATIVA
-- ============================================

-- PROBLEMA:
-- RLS policies assumem que todos os usuários estão em funcionarios
-- Gestores (RH e Entidade) estão em contratantes_senhas, não funcionarios
-- Isso causa falhas em validateSessionContext quando gestores fazem queries

-- SOLUÇÃO:
-- Alterar RLS policies para considerar apenas funcionários operacionais
-- Gestores usam validação manual via requireEntity/requireClinica
-- Gestores não dependem de RLS - usam queries diretas

-- ============================================
-- 1. ATUALIZAR FUNÇÕES DE CONTEXTO RLS
-- ============================================

-- Adicionar função para verificar se usuário atual é gestor
CREATE OR REPLACE FUNCTION public.current_user_is_gestor() 
RETURNS BOOLEAN AS $$
DECLARE
    v_perfil TEXT;
BEGIN
    v_perfil := current_setting('app.current_user_perfil', TRUE);
    RETURN v_perfil IN ('rh', 'gestor_entidade', 'admin');
EXCEPTION 
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_is_gestor() IS 
'Retorna TRUE se o usuário atual é gestor (RH, Entidade ou Admin). Gestores não usam RLS.';

-- ============================================
-- 2. ATUALIZAR POLICIES PARA TABELA funcionarios
-- ============================================

-- Gestores não precisam de RLS para funcionarios
-- RH acessa via queries diretas após validação manual
-- Funcionários comuns continuam usando RLS

-- Policy: Funcionário vê apenas seus próprios dados
DROP POLICY IF EXISTS funcionarios_own_select ON public.funcionarios;
CREATE POLICY funcionarios_own_select ON public.funcionarios 
FOR SELECT TO PUBLIC 
USING (
    -- Funcionários veem apenas próprios dados
    (cpf = current_user_cpf() AND NOT current_user_is_gestor())
);

COMMENT ON POLICY funcionarios_own_select ON public.funcionarios IS 
'Funcionários comuns veem apenas seus próprios dados. Gestores usam queries diretas sem RLS.';

-- Policy: RH não usa RLS (removida)
-- RH agora usa queries diretas após validação em requireRHWithEmpresaAccess
DROP POLICY IF EXISTS funcionarios_rh_clinica ON public.funcionarios;

-- Policy: Admin não usa RLS (removida)  
-- Admin usa queries diretas após validação em requireRole('admin')
DROP POLICY IF EXISTS funcionarios_admin_all ON public.funcionarios;

-- ============================================
-- 3. ATUALIZAR POLICIES PARA TABELA avaliacoes
-- ============================================

-- Policy: Funcionário vê apenas suas avaliações
DROP POLICY IF EXISTS avaliacoes_own_select ON public.avaliacoes;
CREATE POLICY avaliacoes_own_select ON public.avaliacoes 
FOR SELECT TO PUBLIC 
USING (
    -- Funcionários veem apenas próprias avaliações
    (funcionario_cpf = current_user_cpf() AND NOT current_user_is_gestor())
);

-- Policy: RH não usa RLS (removida)
DROP POLICY IF EXISTS avaliacoes_rh_clinica ON public.avaliacoes;

-- ============================================
-- 4. ATUALIZAR POLICIES PARA TABELA empresas_clientes
-- ============================================

-- Empresas são acessadas apenas por gestores
-- Gestores usam validação manual, não RLS
-- Funcionários comuns não acessam empresas diretamente

-- Remover todas as policies de RLS para empresas
DROP POLICY IF EXISTS empresas_rh_clinica ON public.empresas_clientes;
DROP POLICY IF EXISTS empresas_rh_insert ON public.empresas_clientes;
DROP POLICY IF EXISTS empresas_rh_update ON public.empresas_clientes;

-- Desabilitar RLS para empresas (apenas gestores acessam)
ALTER TABLE public.empresas_clientes DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.empresas_clientes IS 
'RLS desabilitado - acesso restrito a gestores via validação manual';

-- ============================================
-- 5. ATUALIZAR POLICIES PARA TABELA lotes_avaliacao
-- ============================================

-- Policy: Funcionário vê lotes onde tem avaliação
DROP POLICY IF EXISTS lotes_funcionario_select ON public.lotes_avaliacao;
CREATE POLICY lotes_funcionario_select ON public.lotes_avaliacao 
FOR SELECT TO PUBLIC 
USING (
    -- Funcionários veem apenas lotes onde têm avaliação
    (
        NOT current_user_is_gestor() 
        AND EXISTS (
            SELECT 1 
            FROM public.avaliacoes a 
            WHERE a.lote_id = lotes_avaliacao.id 
            AND a.funcionario_cpf = current_user_cpf()
        )
    )
);

-- Policy: RH não usa RLS (removida)
DROP POLICY IF EXISTS lotes_rh_clinica ON public.lotes_avaliacao;
DROP POLICY IF EXISTS lotes_rh_insert ON public.lotes_avaliacao;
DROP POLICY IF EXISTS lotes_rh_update ON public.lotes_avaliacao;

-- Policy: Emissor não usa RLS (removida - emissor usa queries diretas)
DROP POLICY IF EXISTS lotes_emissor_select ON public.lotes_avaliacao;

-- ============================================
-- 6. ATUALIZAR POLICIES PARA TABELA laudos
-- ============================================

-- Laudos são acessados por emissores e gestores
-- Ambos usam validação manual, não RLS

DROP POLICY IF EXISTS laudos_emissor_select ON public.laudos;
DROP POLICY IF EXISTS laudos_emissor_insert ON public.laudos;
DROP POLICY IF EXISTS laudos_emissor_update ON public.laudos;
DROP POLICY IF EXISTS laudos_rh_clinica ON public.laudos;

-- Desabilitar RLS para laudos
ALTER TABLE public.laudos DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.laudos IS 
'RLS desabilitado - acesso restrito a emissores/gestores via validação manual';

-- ============================================
-- 7. ATUALIZAR POLICIES PARA TABELA respostas
-- ============================================

-- Policy: Funcionário vê apenas suas respostas
DROP POLICY IF EXISTS respostas_own_select ON public.respostas;
CREATE POLICY respostas_own_select ON public.respostas 
FOR SELECT TO PUBLIC 
USING (
    -- Funcionários veem apenas próprias respostas
    (
        NOT current_user_is_gestor()
        AND EXISTS (
            SELECT 1 
            FROM public.avaliacoes a 
            WHERE a.id = respostas.avaliacao_id 
            AND a.funcionario_cpf = current_user_cpf()
        )
    )
);

-- Policy: RH não usa RLS (removida)
DROP POLICY IF EXISTS respostas_rh_clinica ON public.respostas;

-- ============================================
-- 8. ATUALIZAR POLICIES PARA TABELA resultados
-- ============================================

-- Policy: Funcionário vê apenas seus resultados
DROP POLICY IF EXISTS resultados_own_select ON public.resultados;
CREATE POLICY resultados_own_select ON public.resultados 
FOR SELECT TO PUBLIC 
USING (
    -- Funcionários veem apenas próprios resultados
    (
        NOT current_user_is_gestor()
        AND EXISTS (
            SELECT 1 
            FROM public.avaliacoes a 
            WHERE a.id = resultados.avaliacao_id 
            AND a.funcionario_cpf = current_user_cpf()
        )
    )
);

-- Policy: RH não usa RLS (removida)
DROP POLICY IF EXISTS resultados_rh_clinica ON public.resultados;

-- ============================================
-- 9. VALIDAÇÃO FINAL
-- ============================================

DO $$
DECLARE
    v_policies_funcionarios INTEGER;
    v_policies_avaliacoes INTEGER;
    v_rls_empresas BOOLEAN;
    v_rls_laudos BOOLEAN;
BEGIN
    -- Contar policies restantes para funcionarios
    SELECT COUNT(*) INTO v_policies_funcionarios
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename = 'funcionarios';

    -- Contar policies restantes para avaliacoes
    SELECT COUNT(*) INTO v_policies_avaliacoes
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename = 'avaliacoes';

    -- Verificar se RLS foi desabilitado para empresas
    SELECT relrowsecurity INTO v_rls_empresas
    FROM pg_class
    WHERE relname = 'empresas_clientes' AND relnamespace = 'public'::regnamespace;

    -- Verificar se RLS foi desabilitado para laudos
    SELECT relrowsecurity INTO v_rls_laudos
    FROM pg_class
    WHERE relname = 'laudos' AND relnamespace = 'public'::regnamespace;

    RAISE NOTICE 'VALIDAÇÃO FINAL:';
    RAISE NOTICE '  - Policies em funcionarios: % (esperado: 1 - apenas funcionarios_own_select)', v_policies_funcionarios;
    RAISE NOTICE '  - Policies em avaliacoes: % (esperado: 1 - apenas avaliacoes_own_select)', v_policies_avaliacoes;
    RAISE NOTICE '  - RLS em empresas_clientes: % (esperado: FALSE)', v_rls_empresas;
    RAISE NOTICE '  - RLS em laudos: % (esperado: FALSE)', v_rls_laudos;

    IF v_rls_empresas = TRUE THEN
        RAISE WARNING 'RLS ainda está ativo em empresas_clientes';
    END IF;

    IF v_rls_laudos = TRUE THEN
        RAISE WARNING 'RLS ainda está ativo em laudos';
    END IF;
END $$;

COMMIT;

-- ============================================
-- INSTRUÇÕES PÓS-MIGRAÇÃO
-- ============================================

-- 1. Testar login e operações de gestores:
--    - Gestor RH criando lote
--    - Gestor Entidade liberando lote
--    - Funcionário respondendo avaliação

-- 2. Verificar logs de queries:
--    - Gestores devem usar queryAsGestor (sem RLS)
--    - Funcionários devem usar queryWithContext (com RLS)

-- 3. Verificar que gestores NÃO estão em funcionarios:
--    SELECT * FROM funcionarios WHERE perfil IN ('rh', 'gestor_entidade');
--    -- Resultado esperado: 0 rows (ou apenas registros antigos/inválidos)

-- 4. Confirmar que gestores estão em contratantes_senhas:
--    SELECT cs.cpf, c.nome, c.tipo 
--    FROM contratantes_senhas cs
--    JOIN contratantes c ON c.id = cs.contratante_id
--    WHERE c.ativa = true;
