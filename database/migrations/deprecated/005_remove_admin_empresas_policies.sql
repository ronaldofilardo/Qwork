-- ==========================================
-- MIGRATION 005: Remover Políticas de Admin para Empresas
-- Data: 28/12/2025
-- Objetivo: Remover acesso de admin a empresas_clientes
--           conforme política de segurança onde somente RH
--           da clínica pode gerenciar suas empresas
-- ==========================================

\echo 'MIGRATION 005: Removendo políticas de admin para empresas...'

-- Remover políticas de admin para empresas_clientes
DROP POLICY IF EXISTS "empresas_admin_select" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_insert" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_update" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_delete" ON empresas_clientes;
DROP POLICY IF EXISTS "admin_view_empresas" ON empresas_clientes;
DROP POLICY IF EXISTS "admin_manage_empresas" ON empresas_clientes;
DROP POLICY IF EXISTS "admin_update_empresas" ON empresas_clientes;
DROP POLICY IF EXISTS "admin_delete_empresas" ON empresas_clientes;
DROP POLICY IF EXISTS "admin_all_empresas" ON empresas_clientes;

\echo 'Políticas de admin para empresas removidas com sucesso!'

-- Verificar políticas restantes (deve mostrar apenas políticas de RH e funcionários)
\echo 'Políticas ativas em empresas_clientes:'
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'empresas_clientes'
ORDER BY policyname;

\echo 'MIGRATION 005 concluída com sucesso!'
