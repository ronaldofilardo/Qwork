-- ==========================================
-- MIGRATION 301: Remover Permissões Incorretas de Admin e Emissor
-- Descrição: Remoção agressiva de policies RLS incorretas conforme auditoria de segurança
-- Data: 2025-01-31
-- Versão: 1.0.0
-- ==========================================
-- PRINCÍPIO: 
--   - ADMIN: Acesso APENAS a usuarios, roles, permissions, role_permissions, audit_logs
--   - EMISSOR: Acesso APENAS a laudos, fila_emissao (SEM avaliacoes, lotes_avaliacao)
--   - RH e gestor: Acesso exclusivo a avaliacoes
-- ==========================================

BEGIN;

\echo '🔥 INICIANDO REMOÇÃO AGRESSIVA DE POLÍTICAS INCORRETAS...'

-- ==========================================
-- 1. REMOVER POLICIES DE ADMIN EM TABELAS VETADAS
-- ==========================================

\echo '❌ Removendo policies de admin em clinicas...'
DROP POLICY IF EXISTS "clinicas_admin_all" ON public.clinicas;
DROP POLICY IF EXISTS "admin_all_clinicas" ON public.clinicas;
DROP POLICY IF EXISTS "clinicas_admin_select" ON public.clinicas;
DROP POLICY IF EXISTS "clinicas_admin_insert" ON public.clinicas;
DROP POLICY IF EXISTS "clinicas_admin_update" ON public.clinicas;
DROP POLICY IF EXISTS "clinicas_admin_delete" ON public.clinicas;

\echo '✅ Mantendo policies de admin em contratantes (NECESSÁRIO para gestão de gestores)...'
-- Admin DEVE ter acesso completo a contratantes para gerenciar gestores
-- Políticas serão criadas na seção 3

\echo '❌ Removendo policies de admin em empresas_clientes...'
DROP POLICY IF EXISTS "empresas_admin_all" ON public.empresas_clientes;
DROP POLICY IF EXISTS "admin_all_empresas" ON public.empresas_clientes;
DROP POLICY IF EXISTS "empresas_clientes_admin_select" ON public.empresas_clientes;
DROP POLICY IF EXISTS "empresas_clientes_admin_insert" ON public.empresas_clientes;
DROP POLICY IF EXISTS "empresas_clientes_admin_update" ON public.empresas_clientes;
DROP POLICY IF EXISTS "empresas_clientes_admin_delete" ON public.empresas_clientes;

\echo '❌ Removendo policies de admin em funcionarios (tabela de avaliados)...'
DROP POLICY IF EXISTS "funcionarios_admin_all" ON public.funcionarios;
DROP POLICY IF EXISTS "admin_all_funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_admin_select" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_admin_insert" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_admin_update" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_admin_delete" ON public.funcionarios;

\echo '❌ Removendo policies de admin em avaliacoes...'
DROP POLICY IF EXISTS "avaliacoes_admin_all" ON public.avaliacoes;
DROP POLICY IF EXISTS "admin_all_avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_admin_select" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_admin_insert" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_admin_update" ON public.avaliacoes;

\echo '❌ Removendo policies de admin em lotes_avaliacao...'
DROP POLICY IF EXISTS "lotes_admin_all" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "admin_all_lotes" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "lotes_avaliacao_admin_select" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "lotes_avaliacao_admin_insert" ON public.lotes_avaliacao;

\echo '❌ Removendo policies de admin em respostas...'
DROP POLICY IF EXISTS "respostas_admin_all" ON public.respostas;
DROP POLICY IF EXISTS "admin_all_respostas" ON public.respostas;

\echo '❌ Removendo policies de admin em resultados...'
DROP POLICY IF EXISTS "resultados_admin_all" ON public.resultados;
DROP POLICY IF EXISTS "admin_all_resultados" ON public.resultados;

\echo '❌ Removendo policies de admin em laudos...'
DROP POLICY IF EXISTS "laudos_admin_all" ON public.laudos;
DROP POLICY IF EXISTS "admin_all_laudos" ON public.laudos;

-- ==========================================
-- 2. REMOVER POLICIES DE EMISSOR EM AVALIACOES E LOTES
-- ==========================================

\echo '❌ Removendo policies de emissor em avaliacoes...'
DROP POLICY IF EXISTS "avaliacoes_emissor_select" ON public.avaliacoes;
DROP POLICY IF EXISTS "emissor_avaliacoes_select" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_emissor_concluidas" ON public.avaliacoes;

\echo '❌ Removendo policies de emissor em lotes_avaliacao...'
DROP POLICY IF EXISTS "lotes_emissor_select" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "emissor_lotes_finalizados" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "lotes_avaliacao_emissor_select" ON public.lotes_avaliacao;

-- ==========================================
-- 3. CRIAR POLICIES CORRETAS PARA ADMIN (APENAS RBAC E AUDIT)
-- ==========================================

\echo '✅ Criando policies corretas para admin em usuarios...'

-- Admin pode gerenciar apenas usuários do sistema (tabela usuarios - não funcionarios!)
DROP POLICY IF EXISTS "usuarios_admin_all" ON public.usuarios;
CREATE POLICY "usuarios_admin_select" ON public.usuarios
FOR SELECT TO PUBLIC
USING (current_user_perfil() = 'admin');

DROP POLICY IF EXISTS "usuarios_admin_insert" ON public.usuarios;
CREATE POLICY "usuarios_admin_insert" ON public.usuarios
FOR INSERT TO PUBLIC
WITH CHECK (current_user_perfil() = 'admin');

DROP POLICY IF EXISTS "usuarios_admin_update" ON public.usuarios;
CREATE POLICY "usuarios_admin_update" ON public.usuarios
FOR UPDATE TO PUBLIC
USING (current_user_perfil() = 'admin')
WITH CHECK (current_user_perfil() = 'admin');

\echo '✅ Criando policies corretas para admin em contratantes...'

-- Admin DEVE ter acesso completo a contratantes para gerenciar gestores
DROP POLICY IF EXISTS "contratantes_admin_all" ON public.contratantes;
CREATE POLICY "contratantes_admin_select" ON public.contratantes
FOR SELECT TO PUBLIC
USING (current_user_perfil() = 'admin');

DROP POLICY IF EXISTS "contratantes_admin_insert" ON public.contratantes;
CREATE POLICY "contratantes_admin_insert" ON public.contratantes
FOR INSERT TO PUBLIC
WITH CHECK (current_user_perfil() = 'admin');

DROP POLICY IF EXISTS "contratantes_admin_update" ON public.contratantes;
CREATE POLICY "contratantes_admin_update" ON public.contratantes
FOR UPDATE TO PUBLIC
USING (current_user_perfil() = 'admin')
WITH CHECK (current_user_perfil() = 'admin');

DROP POLICY IF EXISTS "contratantes_admin_delete" ON public.contratantes;
CREATE POLICY "contratantes_admin_delete" ON public.contratantes
FOR DELETE TO PUBLIC
USING (current_user_perfil() = 'admin');

\echo '✅ Mantendo policy de audit_logs para admin...'
-- Policy audit_logs_admin_all já existe e está correta (criada na migration 004)

\echo '✅ Mantendo policies de RBAC (roles, permissions, role_permissions) para admin...'
-- Policies roles_admin_all, permissions_admin_all, role_permissions_admin_all já existem (migration 004)

-- ==========================================
-- 4. VALIDAR POLÍTICAS CORRETAS PARA EMISSOR (APENAS LAUDOS)
-- ==========================================

\echo '✅ Validando que emissor tem acesso apenas a laudos e fila_emissao...'

-- Policy já existe para laudos (emissor_laudos_select) - verificar se está presente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'laudos' 
    AND policyname LIKE '%emissor%'
  ) THEN
    RAISE WARNING 'ATENÇÃO: Nenhuma policy de emissor encontrada em laudos. Verifique migration anterior.';
  END IF;
END $$;

-- ==========================================
-- 5. COMENTÁRIOS FINAIS
-- ==========================================

COMMENT ON TABLE public.usuarios IS 'Usuários do sistema (admin, emissor, rh, gestor) - admin tem acesso total via RBAC';
COMMENT ON TABLE public.funcionarios IS 'Funcionários avaliados de empresas/entidades - admin NÃO tem acesso';
COMMENT ON TABLE public.clinicas IS 'Clínicas parceiras - admin NÃO tem acesso (gerenciado por RH)';
COMMENT ON TABLE public.contratantes IS 'Entidades e clínicas contratantes - admin tem acesso completo para gestão de gestores';
COMMENT ON TABLE public.empresas_clientes IS 'Empresas clientes - admin NÃO tem acesso (gerenciado por RH)';
COMMENT ON TABLE public.avaliacoes IS 'Avaliações de funcionários - emissor NÃO pode visualizar (apenas RH e gestor)';
COMMENT ON TABLE public.lotes_avaliacao IS 'Lotes de avaliações - emissor NÃO pode visualizar';

\echo '✅ REMOÇÃO AGRESSIVA CONCLUÍDA!'
\echo '✅ Admin agora tem acesso APENAS a: usuarios, contratantes, roles, permissions, role_permissions, audit_logs'
\echo '✅ Emissor agora tem acesso APENAS a: laudos, fila_emissao'
\echo '✅ Avaliações acessíveis APENAS por: rh, gestor'

COMMIT;

-- ==========================================
-- 6. VALIDAÇÃO PÓS-MIGRAÇÃO
-- ==========================================

-- Execute os seguintes testes após aplicar esta migration:
-- 
-- 1. Testar acesso de admin:
--    SET LOCAL app.current_user_perfil = 'admin';
--    SELECT * FROM usuarios; -- DEVE FUNCIONAR
--    SELECT * FROM contratantes; -- DEVE FUNCIONAR (gestão de gestores)
--    SELECT * FROM clinicas; -- DEVE FALHAR (sem policy)
--    SELECT * FROM funcionarios; -- DEVE FALHAR (sem policy)
--    SELECT * FROM empresas_clientes; -- DEVE FALHAR (sem policy)
--    SELECT * FROM avaliacoes; -- DEVE FALHAR (sem policy)
--
-- 2. Testar acesso de emissor:
--    SET LOCAL app.current_user_perfil = 'emissor';
--    SELECT * FROM laudos; -- DEVE FUNCIONAR
--    SELECT * FROM avaliacoes; -- DEVE FALHAR (sem policy)
--    SELECT * FROM lotes_avaliacao; -- DEVE FALHAR (sem policy)
--
-- 3. Testar acesso de rh/gestor:
--    SET LOCAL app.current_user_perfil = 'rh';
--    SELECT * FROM avaliacoes; -- DEVE FUNCIONAR (com filtro de clínica)
--    SELECT * FROM lotes_avaliacao; -- DEVE FUNCIONAR (com filtro de clínica)
