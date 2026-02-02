-- Script de aplicacao: Migrations 206 e 207
-- Data: 2026-01-29
-- Descricao: Adicionar role gestor_entidade no sistema RBAC

-- ==========================================
-- VERIFICACOES PRE-MIGRATION
-- ==========================================

\echo ''
\echo '========================================'
\echo 'PRE-VERIFICACOES'
\echo '========================================'
\echo ''

-- 1. Verificar se role ja existe
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'AVISO: Role gestor_entidade JA EXISTE (sera atualizado)'
    ELSE 'OK: Role gestor_entidade nao existe (sera criado)'
  END as status
FROM roles 
WHERE name = 'gestor_entidade';

-- 2. Verificar helper function
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'AVISO: Function current_user_contratante_id JA EXISTE (sera recriada)'
    ELSE 'OK: Function nao existe (sera criada)'
  END as status
FROM information_schema.routines
WHERE routine_name = 'current_user_contratante_id'
  AND routine_schema = 'public';

-- 3. Verificar perfil continua sendo VARCHAR
SELECT 
  CASE 
    WHEN data_type = 'character varying' THEN 'OK: Perfil e VARCHAR (correto)'
    ELSE 'ERRO: Perfil NAO e VARCHAR (verificar!)'
  END as status
FROM information_schema.columns
WHERE table_name = 'funcionarios'
  AND column_name = 'perfil';

\echo ''
\echo 'Pressione ENTER para continuar ou Ctrl+C para cancelar...'
\prompt continue

-- ==========================================
-- APLICAR MIGRATIONS
-- ==========================================

\echo ''
\echo '========================================'
\echo 'APLICANDO MIGRATION 206'
\echo '========================================'
\echo ''

\i database/migrations/206_add_gestor_entidade_role.sql

\echo ''
\echo '========================================'
\echo 'APLICANDO MIGRATION 207'
\echo '========================================'
\echo ''

\i database/migrations/207_add_current_user_contratante_id_helper.sql

-- ==========================================
-- VERIFICACOES POS-MIGRATION
-- ==========================================

\echo ''
\echo '========================================'
\echo 'VERIFICACOES POS-MIGRATION'
\echo '========================================'
\echo ''

-- 1. Verificar role foi criado
\echo '1. Role gestor_entidade:'
SELECT 
  id,
  name,
  display_name,
  hierarchy_level,
  active
FROM roles 
WHERE name = 'gestor_entidade';

\echo ''
\echo '2. Permissoes associadas:'
SELECT 
  p.name as permission,
  p.resource,
  p.action
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.name = 'gestor_entidade'
ORDER BY p.resource, p.action;

\echo ''
\echo '3. Comparacao com role RH:'
SELECT 
  r.name as role,
  COUNT(*) as total_permissions
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
WHERE r.name IN ('rh', 'gestor_entidade')
GROUP BY r.name;

\echo ''
\echo '4. Helper function criada:'
SELECT 
  routine_name,
  data_type as return_type
FROM information_schema.routines
WHERE routine_name = 'current_user_contratante_id'
  AND routine_schema = 'public';

\echo ''
\echo '========================================'
\echo 'OK - MIGRATIONS APLICADAS COM SUCESSO!'
\echo '========================================'
\echo ''
\echo 'Proximos passos:'
\echo '  1. Testar login como gestor de entidade'
\echo '  2. Verificar acesso as rotas /entidade/*'
\echo '  3. Validar isolamento RLS'
\echo ''
