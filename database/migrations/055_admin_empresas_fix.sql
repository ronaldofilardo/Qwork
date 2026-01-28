-- ==========================================
-- MIGRAÇÃO 055: CORREÇÃO DE PERMISSÕES ADMIN PARA EMPRESAS
-- Data: 2025-12-27
-- Descrição: Corrige permissões do perfil admin para criar/gerenciar empresas dentro de clínicas
-- ==========================================

BEGIN;

-- ==========================================
-- 1. REMOVER POLÍTICAS ANTIGAS PARA EMPRESAS_CLIENTES
-- ==========================================

\echo 'Removendo políticas antigas para empresas_clientes...'

DROP POLICY IF EXISTS "empresas_rh_select" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_rh_insert" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_rh_update" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_rh_delete" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_select" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_insert" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_update" ON empresas_clientes;

-- ==========================================
-- 2. CRIAR NOVAS POLÍTICAS PARA EMPRESAS_CLIENTES
-- ==========================================

\echo 'Criando novas políticas para empresas_clientes...'

-- RH: Acesso apenas às empresas da sua clínica
CREATE POLICY "empresas_rh_select" ON empresas_clientes FOR
SELECT TO PUBLIC USING (
    current_user_perfil() = 'rh'
    AND clinica_id = current_user_clinica_id()
);

CREATE POLICY "empresas_rh_insert" ON empresas_clientes FOR
INSERT TO PUBLIC WITH CHECK (
    current_user_perfil() = 'rh'
    AND clinica_id = current_user_clinica_id()
);

CREATE POLICY "empresas_rh_update" ON empresas_clientes FOR
UPDATE TO PUBLIC USING (
    current_user_perfil() = 'rh'
    AND clinica_id = current_user_clinica_id()
) WITH CHECK (
    current_user_perfil() = 'rh'
    AND clinica_id = current_user_clinica_id()
);

CREATE POLICY "empresas_rh_delete" ON empresas_clientes FOR
DELETE TO PUBLIC USING (
    current_user_perfil() = 'rh'
    AND clinica_id = current_user_clinica_id()
    AND NOT EXISTS (
        SELECT 1 FROM funcionarios f
        WHERE f.empresa_id = empresas_clientes.id
        AND f.ativo = TRUE
    )
);

-- ADMIN: Acesso completo a todas as empresas (full access)
CREATE POLICY "empresas_admin_select" ON empresas_clientes FOR
SELECT TO PUBLIC USING (
    current_user_perfil() = 'admin'
);

CREATE POLICY "empresas_admin_insert" ON empresas_clientes FOR
INSERT TO PUBLIC WITH CHECK (
    current_user_perfil() = 'admin'
);

CREATE POLICY "empresas_admin_update" ON empresas_clientes FOR
UPDATE TO PUBLIC USING (
    current_user_perfil() = 'admin'
) WITH CHECK (
    current_user_perfil() = 'admin'
);

CREATE POLICY "empresas_admin_delete" ON empresas_clientes FOR
DELETE TO PUBLIC USING (
    current_user_perfil() = 'admin'
);

-- ==========================================
-- 3. VERIFICAÇÃO DE PERMISSÕES RBAC
-- ==========================================

\echo 'Verificando permissões RBAC para admin...'

-- Garantir que o role 'admin' tem a permissão 'manage:empresas'
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name = 'manage:empresas'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 4. LOG DE AUDITORIA
-- ==========================================

\echo 'Registrando correção no log de auditoria...'

INSERT INTO audit_logs (
    resource,
    action,
    details,
    ip_address,
    user_agent
) VALUES (
    'migrations',
    '055_admin_empresas_fix',
    'Corrigido permissões admin para empresas_clientes - admin agora tem full access',
    null,
    null
);

COMMIT;

-- ==========================================
-- FIM DA MIGRAÇÃO
-- ==========================================