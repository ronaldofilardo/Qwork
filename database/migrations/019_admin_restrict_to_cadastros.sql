-- Migration 019: Restringir Admin a Funções Administrativas
-- Data: 2026-01-29
-- Descrição: Remove permissões operacionais do admin e restringe a cadastros de RH, clínicas e admins

BEGIN;

-- Remover associações antigas de permissões operacionais do admin
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'admin')
AND permission_id IN (
    SELECT id FROM permissions 
    WHERE name IN (
        'manage:avaliacoes',
        'manage:funcionarios',
        'manage:empresas',
        'manage:lotes',
        'manage:laudos'
    )
);

-- Criar novas permissões administrativas se não existirem
INSERT INTO permissions (name, resource, action, description)
VALUES
    ('manage:rh', 'rh', 'manage', 'Gerenciar cadastro de usuários RH'),
    ('manage:clinicas', 'clinicas', 'manage', 'Gerenciar cadastro de clínicas'),
    ('manage:admins', 'admins', 'manage', 'Gerenciar cadastro de outros administradores')
ON CONFLICT (name) DO NOTHING;

-- Associar novas permissões administrativas ao perfil admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
AND p.name IN ('manage:rh', 'manage:clinicas', 'manage:admins')
ON CONFLICT DO NOTHING;

-- Comentários explicativos
COMMENT ON TABLE role_permissions IS 
'Admin tem apenas permissões de cadastro (RH, clínicas, admins). 
Operações como gerenciar avaliações, lotes, empresas e funcionários são de responsabilidade de RH e entidade_gestor.
Emissão de laudos é exclusiva de emissores.';

COMMIT;

-- Validação: Verificar que admin tem apenas 3 permissões
DO $$
DECLARE
    admin_permissions_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_permissions_count
    FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    WHERE r.name = 'admin';
    
    IF admin_permissions_count != 3 THEN
        RAISE WARNING 'Admin deveria ter 3 permissões, mas tem %', admin_permissions_count;
    ELSE
        RAISE NOTICE 'Admin tem 3 permissões administrativas conforme esperado';
    END IF;
END $$;
