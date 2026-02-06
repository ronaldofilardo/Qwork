-- ==========================================
-- SCRIPT: Limpeza de Policies Incorretas em Dumps
-- Descrição: Remove policies admin_all_* e lotes_emissor_select de dumps antes de restore
-- Data: 04/02/2026
-- Uso: Executar APÓS restore de dump para corrigir policies
-- ==========================================

BEGIN;

\echo '🧹 LIMPANDO POLICIES INCORRETAS DE DUMP...'

-- ==========================================
-- 1. REMOVER POLICIES INCORRETAS DE ADMIN
-- ==========================================

\echo '❌ Removendo admin_all_avaliacoes...'
DROP POLICY IF EXISTS admin_all_avaliacoes ON public.avaliacoes;

\echo '❌ Removendo admin_all_empresas...'
DROP POLICY IF EXISTS admin_all_empresas ON public.empresas_clientes;

\echo '❌ Removendo admin_all_laudos...'
DROP POLICY IF EXISTS admin_all_laudos ON public.laudos;

\echo '❌ Removendo admin_all_lotes...'
DROP POLICY IF EXISTS admin_all_lotes ON public.lotes_avaliacao;

\echo '❌ Removendo admin_all_respostas...'
DROP POLICY IF EXISTS admin_all_respostas ON public.respostas;

\echo '❌ Removendo admin_all_resultados...'
DROP POLICY IF EXISTS admin_all_resultados ON public.resultados;

\echo '❌ Removendo clinicas_admin_all...'
DROP POLICY IF EXISTS clinicas_admin_all ON public.clinicas;

\echo '❌ Removendo contratantes_admin_all...'
DROP POLICY IF EXISTS contratantes_admin_all ON public.contratantes;

\echo '❌ Removendo admin_restricted_funcionarios (permissivo demais)...'
DROP POLICY IF EXISTS admin_restricted_funcionarios ON public.funcionarios;

-- ==========================================
-- 2. VALIDAR POLICIES RESTRITIVAS EXISTEM
-- ==========================================

\echo '✅ Verificando avaliacoes_block_admin...'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'avaliacoes' 
    AND policyname = 'avaliacoes_block_admin'
  ) THEN
    CREATE POLICY avaliacoes_block_admin ON public.avaliacoes 
    AS RESTRICTIVE USING (current_user_perfil() <> 'admin');
    RAISE NOTICE 'Policy avaliacoes_block_admin criada';
  END IF;
END $$;

\echo '✅ Verificando empresas_block_admin...'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'empresas_clientes' 
    AND policyname = 'empresas_block_admin'
  ) THEN
    CREATE POLICY empresas_block_admin ON public.empresas_clientes 
    AS RESTRICTIVE USING (current_user_perfil() <> 'admin');
    RAISE NOTICE 'Policy empresas_block_admin criada';
  END IF;
END $$;

-- ==========================================
-- 3. CORRIGIR POLICY PROBLEMÁTICA avaliacoes_own_update
-- ==========================================

\echo '⚠️ Corrigindo avaliacoes_own_update (não deve incluir admin)...'
DROP POLICY IF EXISTS avaliacoes_own_update ON public.avaliacoes;

CREATE POLICY avaliacoes_own_update ON public.avaliacoes 
FOR UPDATE 
USING (
  (funcionario_cpf = current_user_cpf()) 
  OR (current_user_perfil() IN ('rh', 'gestor'))
); -- Admin removido

-- ==========================================
-- 4. CRIAR POLICIES CORRETAS PARA USUARIOS
-- ==========================================

\echo '✅ Garantindo policies corretas de admin em usuarios...'

DROP POLICY IF EXISTS usuarios_admin_all ON public.usuarios;

-- SELECT
DROP POLICY IF EXISTS usuarios_admin_select ON public.usuarios;
CREATE POLICY usuarios_admin_select ON public.usuarios
FOR SELECT TO PUBLIC
USING (current_user_perfil() = 'admin');

-- INSERT
DROP POLICY IF EXISTS usuarios_admin_insert ON public.usuarios;
CREATE POLICY usuarios_admin_insert ON public.usuarios
FOR INSERT TO PUBLIC
WITH CHECK (current_user_perfil() = 'admin');

-- UPDATE
DROP POLICY IF EXISTS usuarios_admin_update ON public.usuarios;
CREATE POLICY usuarios_admin_update ON public.usuarios
FOR UPDATE TO PUBLIC
USING (current_user_perfil() = 'admin')
WITH CHECK (current_user_perfil() = 'admin');

\echo '✅ LIMPEZA CONCLUÍDA!'
\echo 'Dump agora está alinhado com policies corretas.'

COMMIT;

-- ==========================================
-- VALIDAÇÃO PÓS-LIMPEZA
-- ==========================================

\echo ''
\echo '🔍 VALIDAÇÃO - Policies problemáticas restantes:'
SELECT 
  schemaname, 
  tablename, 
  policyname,
  'ATENÇÃO: Policy admin_all ainda existe!' as alerta
FROM pg_policies 
WHERE policyname LIKE '%admin_all%'
AND schemaname = 'public';

\echo ''
\echo '✅ Policies restritivas ativas (esperado: 2+):'
SELECT 
  schemaname, 
  tablename, 
  policyname
FROM pg_policies 
WHERE policyname LIKE '%block_admin%'
AND schemaname = 'public';
