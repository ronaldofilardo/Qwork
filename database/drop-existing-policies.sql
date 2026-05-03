-- Script para remover todas as políticas RLS existentes
DROP POLICY IF EXISTS "admin_restricted_funcionarios" ON funcionarios;

DROP POLICY IF EXISTS "admin_manage_clinicas" ON clinicas;

DROP POLICY IF EXISTS "admin_view_empresas" ON empresas_clientes;

DROP POLICY IF EXISTS "admin_manage_empresas" ON empresas_clientes;

DROP POLICY IF EXISTS "admin_update_empresas" ON empresas_clientes;

DROP POLICY IF EXISTS "admin_delete_empresas" ON empresas_clientes;







