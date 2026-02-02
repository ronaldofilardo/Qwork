-- ============================================================================
-- Script: Popular Roles e Permissions
-- Data: 31/01/2026
-- Banco: nr-bps_db
-- ============================================================================
-- ATENÇÃO: Este script popula as tabelas roles e permissions para RBAC
-- ============================================================================

BEGIN;

-- Configurar variáveis necessárias para audit logs
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';

\echo ''
\echo '==================== LIMPANDO DADOS EXISTENTES ===================='
\echo ''

-- Limpar dados existentes (se houver)
DELETE FROM role_permissions;
DELETE FROM permissions;
DELETE FROM roles;

-- Resetar sequences
ALTER SEQUENCE roles_id_seq RESTART WITH 1;
ALTER SEQUENCE permissions_id_seq RESTART WITH 1;

\echo ''
\echo '==================== CRIANDO ROLES (PAPÉIS) ===================='
\echo ''

-- ============================================================================
-- ROLES - Papéis do Sistema
-- ============================================================================
-- hierarchy_level: Quanto MAIOR o número, MAIOR a hierarquia
-- 100 = Admin (topo)
-- 80 = Emissor (independente)
-- 60 = RH (gestor de clínica)
-- 40 = Gestor Entidade (gestor de empresa contratante)
-- 20 = Funcionário (base)
-- ============================================================================

INSERT INTO roles (name, display_name, description, hierarchy_level, active) VALUES
('admin', 'Administrador', 'Administrador do sistema - gerencia APENAS aspectos administrativos: clínicas, contratantes, planos e emissores. NÃO tem acesso operacional (empresas, funcionários, avaliações, lotes, laudos)', 100, true),
('emissor', 'Emissor de Laudos', 'Profissional responsável pela emissão e assinatura de laudos médicos - papel independente', 80, true),
('rh', 'Gestor de Clínica (RH)', 'Gestor de clínica responsável por gerenciar empresas clientes e seus funcionários', 60, true),
('gestor_entidade', 'Gestor de Entidade', 'Gestor de empresa contratante responsável por gerenciar funcionários da própria empresa', 40, true),
('funcionario', 'Funcionário', 'Funcionário que realiza avaliações', 20, true);

\echo 'Roles criadas:'
SELECT id, name, display_name, hierarchy_level FROM roles ORDER BY hierarchy_level DESC;

\echo ''
\echo '==================== CRIANDO PERMISSIONS ===================='
\echo ''

-- ============================================================================
-- PERMISSIONS - Permissões Granulares
-- ============================================================================
-- Format: resource:action
-- Recursos: clinicas, contratantes, funcionarios, avaliacoes, lotes, laudos, planos, emissores
-- Ações: create, read, update, delete, manage, approve, reject, emit, assign
-- ============================================================================

-- Permissões de CLÍNICAS
INSERT INTO permissions (name, resource, action, description) VALUES
('clinicas:manage', 'clinicas', 'manage', 'Gerenciar clínicas (CRUD completo)'),
('clinicas:read', 'clinicas', 'read', 'Visualizar clínicas'),
('clinicas:approve', 'clinicas', 'approve', 'Aprovar cadastros de clínicas');

-- Permissões de CONTRATANTES (Entidades)
INSERT INTO permissions (name, resource, action, description) VALUES
('contratantes:manage', 'contratantes', 'manage', 'Gerenciar contratantes/entidades (CRUD completo)'),
('contratantes:read', 'contratantes', 'read', 'Visualizar contratantes'),
('contratantes:approve', 'contratantes', 'approve', 'Aprovar cadastros de contratantes'),
('contratantes:own', 'contratantes', 'own', 'Gerenciar próprio contratante (gestor_entidade)');

-- Permissões de EMPRESAS CLIENTES (para RH)
INSERT INTO permissions (name, resource, action, description) VALUES
('empresas:manage', 'empresas', 'manage', 'Gerenciar empresas clientes da clínica'),
('empresas:read', 'empresas', 'read', 'Visualizar empresas clientes');

-- Permissões de FUNCIONÁRIOS
INSERT INTO permissions (name, resource, action, description) VALUES
('funcionarios:manage', 'funcionarios', 'manage', 'Gerenciar funcionários (CRUD completo)'),
('funcionarios:read', 'funcionarios', 'read', 'Visualizar funcionários'),
('funcionarios:create', 'funcionarios', 'create', 'Criar funcionários'),
('funcionarios:update', 'funcionarios', 'update', 'Atualizar funcionários'),
('funcionarios:delete', 'funcionarios', 'delete', 'Deletar funcionários'),
('funcionarios:own', 'funcionarios', 'own', 'Gerenciar próprios dados');

-- Permissões de AVALIAÇÕES
INSERT INTO permissions (name, resource, action, description) VALUES
('avaliacoes:manage', 'avaliacoes', 'manage', 'Gerenciar avaliações (CRUD completo)'),
('avaliacoes:read', 'avaliacoes', 'read', 'Visualizar avaliações'),
('avaliacoes:create', 'avaliacoes', 'create', 'Criar avaliações'),
('avaliacoes:execute', 'avaliacoes', 'execute', 'Executar/responder avaliações'),
('avaliacoes:inactivate', 'avaliacoes', 'inactivate', 'Inativar avaliações'),
('avaliacoes:reset', 'avaliacoes', 'reset', 'Resetar avaliações');

-- Permissões de LOTES
INSERT INTO permissions (name, resource, action, description) VALUES
('lotes:manage', 'lotes', 'manage', 'Gerenciar lotes (CRUD completo)'),
('lotes:read', 'lotes', 'read', 'Visualizar lotes'),
('lotes:create', 'lotes', 'create', 'Criar lotes'),
('lotes:liberar', 'lotes', 'liberar', 'Liberar lotes para avaliação'),
('lotes:solicitar_emissao', 'lotes', 'solicitar_emissao', 'Solicitar emissão de laudos');

-- Permissões de LAUDOS
INSERT INTO permissions (name, resource, action, description) VALUES
('laudos:manage', 'laudos', 'manage', 'Gerenciar laudos (CRUD completo)'),
('laudos:read', 'laudos', 'read', 'Visualizar laudos'),
('laudos:emit', 'laudos', 'emit', 'Emitir e assinar laudos'),
('laudos:download', 'laudos', 'download', 'Baixar laudos');

-- Permissões de PLANOS
INSERT INTO permissions (name, resource, action, description) VALUES
('planos:manage', 'planos', 'manage', 'Gerenciar planos (CRUD completo)'),
('planos:read', 'planos', 'read', 'Visualizar planos');

-- Permissões de EMISSORES
INSERT INTO permissions (name, resource, action, description) VALUES
('emissores:manage', 'emissores', 'manage', 'Gerenciar emissores (CRUD completo)'),
('emissores:read', 'emissores', 'read', 'Visualizar emissores');

-- Permissões de RELATÓRIOS
INSERT INTO permissions (name, resource, action, description) VALUES
('relatorios:read', 'relatorios', 'read', 'Visualizar relatórios'),
('relatorios:export', 'relatorios', 'export', 'Exportar relatórios');

\echo 'Permissions criadas:'
SELECT COUNT(*) as total_permissions FROM permissions;

\echo ''
\echo '==================== ATRIBUINDO PERMISSIONS AOS ROLES ===================='
\echo ''

-- ============================================================================
-- ADMIN - Apenas Gestão Administrativa (NÃO operacional)
-- ============================================================================
-- Admin gerencia ESTRUTURA do sistema: clínicas, contratantes, planos, emissores
-- Admin NÃO acessa: empresas clientes, funcionários, avaliações, lotes, laudos
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'admin'),
    id
FROM permissions
WHERE name IN (
    -- Clínicas (aprovação e gestão)
    'clinicas:manage',
    'clinicas:read',
    'clinicas:approve',
    -- Contratantes/Entidades (aprovação e gestão)
    'contratantes:manage',
    'contratantes:read',
    'contratantes:approve',
    -- Planos
    'planos:manage',
    'planos:read',
    -- Emissores
    'emissores:manage',
    'emissores:read'
);

\echo 'Admin: permissões administrativas (NÃO operacionais)'
SELECT COUNT(*) as permissions_admin FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'admin');

-- ============================================================================
-- EMISSOR - Apenas Laudos (papel independente)
-- ============================================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'emissor'),
    id
FROM permissions
WHERE name IN (
    'laudos:read',
    'laudos:emit',
    'laudos:manage',
    'avaliacoes:read',
    'lotes:read',
    'funcionarios:read',
    'relatorios:read'
);

\echo 'Emissor: permissões atribuídas'
SELECT COUNT(*) as permissions_emissor FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'emissor');

-- ============================================================================
-- RH (Gestor de Clínica) - Gerenciar Empresas Clientes e Funcionários
-- ============================================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'rh'),
    id
FROM permissions
WHERE name IN (
    -- Empresas clientes
    'empresas:manage',
    'empresas:read',
    -- Funcionários das empresas
    'funcionarios:manage',
    'funcionarios:read',
    'funcionarios:create',
    'funcionarios:update',
    'funcionarios:delete',
    -- Avaliações
    'avaliacoes:read',
    'avaliacoes:create',
    'avaliacoes:inactivate',
    'avaliacoes:reset',
    -- Lotes
    'lotes:read',
    'lotes:create',
    'lotes:liberar',
    'lotes:solicitar_emissao',
    -- Laudos (visualização)
    'laudos:read',
    'laudos:download',
    -- Relatórios
    'relatorios:read',
    'relatorios:export'
);

\echo 'RH: permissões atribuídas'
SELECT COUNT(*) as permissions_rh FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'rh');

-- ============================================================================
-- GESTOR ENTIDADE - Gerenciar Próprios Funcionários
-- ============================================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'gestor_entidade'),
    id
FROM permissions
WHERE name IN (
    -- Próprio contratante
    'contratantes:own',
    'contratantes:read',
    -- Funcionários da entidade
    'funcionarios:manage',
    'funcionarios:read',
    'funcionarios:create',
    'funcionarios:update',
    'funcionarios:delete',
    -- Avaliações
    'avaliacoes:read',
    'avaliacoes:create',
    'avaliacoes:inactivate',
    'avaliacoes:reset',
    -- Lotes
    'lotes:read',
    'lotes:create',
    'lotes:liberar',
    'lotes:solicitar_emissao',
    -- Laudos (visualização)
    'laudos:read',
    'laudos:download',
    -- Relatórios
    'relatorios:read',
    'relatorios:export'
);

\echo 'Gestor Entidade: permissões atribuídas'
SELECT COUNT(*) as permissions_gestor FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'gestor_entidade');

-- ============================================================================
-- FUNCIONÁRIO - Apenas Suas Próprias Avaliações
-- ============================================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'funcionario'),
    id
FROM permissions
WHERE name IN (
    'funcionarios:own',
    'avaliacoes:read',
    'avaliacoes:execute',
    'laudos:read',
    'laudos:download'
);

\echo 'Funcionário: permissões atribuídas'
SELECT COUNT(*) as permissions_func FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'funcionario');

\echo ''
\echo '==================== RESUMO FINAL ===================='
\echo ''

SELECT 
    r.name as role,
    r.display_name,
    r.hierarchy_level,
    COUNT(rp.permission_id) as total_permissions
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
GROUP BY r.id, r.name, r.display_name, r.hierarchy_level
ORDER BY r.hierarchy_level DESC;

\echo ''
\echo '==================== FINALIZAÇÃO ===================='
\echo ''

COMMIT;

\echo ''
\echo '✅ Roles e Permissions criadas com sucesso!'
\echo ''
