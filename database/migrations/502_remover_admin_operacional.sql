-- =========================================
-- MIGRATION 502: Remover Acesso Operacional do Admin
-- =========================================
-- Data: 2026-02-06
-- Motivo: Admin deve ter acesso APENAS administrativo (tomadores, planos, emissores)
--         NÃO deve ter acesso operacional (empresas, funcionários, avaliações, lotes, laudos)
-- 
-- Referência da role admin:
-- "Administrador do sistema - gerencia APENAS aspectos administrativos: 
--  tomadores [clínicas e entidades], planos e emissores. 
--  NÃO tem acesso operacional (empresas, funcionários, avaliações, lotes, laudos)"
-- =========================================

BEGIN;

-- =========================================
-- PARTE 1: Remover policies operacionais do admin
-- =========================================

-- Remover acesso do admin a empresas_clientes
DROP POLICY IF EXISTS admin_todas_empresas ON empresas_clientes;

-- Remover acesso do admin a funcionários
DROP POLICY IF EXISTS admin_all_funcionarios ON funcionarios;
DROP POLICY IF EXISTS funcionarios_admin_select ON funcionarios;
DROP POLICY IF EXISTS funcionarios_admin_all ON funcionarios;

-- Remover acesso do admin a avaliações
DROP POLICY IF EXISTS admin_all_avaliacoes ON avaliacoes;
DROP POLICY IF EXISTS avaliacoes_admin_select ON avaliacoes;
DROP POLICY IF EXISTS avaliacoes_admin_all ON avaliacoes;

-- Remover acesso do admin a lotes
DROP POLICY IF EXISTS admin_all_lotes ON lotes_avaliacao;
DROP POLICY IF EXISTS lotes_admin_select ON lotes_avaliacao;
DROP POLICY IF EXISTS lotes_admin_all ON lotes_avaliacao;

-- Remover acesso do admin a laudos
DROP POLICY IF EXISTS admin_all_laudos ON laudos;
DROP POLICY IF EXISTS laudos_admin_select ON laudos;
DROP POLICY IF EXISTS laudos_admin_all ON laudos;

-- Remover acesso do admin a respostas
DROP POLICY IF EXISTS admin_all_respostas ON respostas;
DROP POLICY IF EXISTS respostas_admin_select ON respostas;

-- Remover acesso do admin a resultados
DROP POLICY IF EXISTS admin_all_resultados ON resultados;
DROP POLICY IF EXISTS resultados_admin_select ON resultados;

-- =========================================
-- PARTE 2: Remover permissões operacionais da role admin
-- =========================================

-- Remover permissões de gerenciamento operacional
DELETE FROM role_permissions 
WHERE role_id = (SELECT id FROM roles WHERE name = 'admin')
  AND permission_id IN (
    SELECT id FROM permissions 
    WHERE name IN (
      'manage:avaliacoes',
      'manage:funcionarios',
      'manage:empresas',
      'manage:lotes',
      'manage:laudos',
      'read:avaliacoes:all',
      'read:funcionarios:all',
      'read:empresas:all',
      'read:lotes:all',
      'read:laudos:all'
    )
  );

-- =========================================
-- PARTE 3: Garantir que admin mantém acesso administrativo
-- =========================================

DO $$
BEGIN
  -- Admin deve ter acesso a clínicas (tomadores tipo clínica)
  IF NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE r.name = 'admin' AND p.name = 'manage:clinicas'
  ) THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id 
    FROM roles r, permissions p
    WHERE r.name = 'admin' AND p.name = 'manage:clinicas'
    ON CONFLICT DO NOTHING;
  END IF;

  -- Admin deve ter acesso a entidades (tomadores tipo entidade)
  IF NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE r.name = 'admin' AND p.name = 'manage:entidades'
  ) THEN
    -- Criar permissão se não existir
    INSERT INTO permissions (name, resource, action, description)
    VALUES (
      'manage:entidades',
      'entidades',
      'manage',
      'Gerenciar entidades (tomadores tipo entidade)'
    )
    ON CONFLICT (name) DO NOTHING;
    
    -- Associar à role admin
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id 
    FROM roles r, permissions p
    WHERE r.name = 'admin' AND p.name = 'manage:entidades'
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- =========================================
-- PARTE 4: Atualizar comentários das tabelas
-- =========================================

COMMENT ON TABLE empresas_clientes IS 'Empresas clientes vinculadas a clínicas - RH tem acesso via clínica, admin NAO tem acesso operacional';
COMMENT ON TABLE funcionarios IS 'Funcionários do sistema - acessível por RH (sua clínica) ou Gestor (sua entidade), admin NAO tem acesso operacional';
COMMENT ON TABLE avaliacoes IS 'Avaliações de risco psicossocial - acessível pelo funcionário (própria), RH (sua clínica) ou Gestor (sua entidade), admin NAO tem acesso operacional';
COMMENT ON TABLE lotes_avaliacao IS 'Lotes de avaliações - gerenciados por RH (clínica) ou Gestor (entidade), admin NAO tem acesso operacional';
COMMENT ON TABLE laudos IS 'Laudos técnicos - emitidos por Emissor, visíveis por RH/Gestor, admin NAO tem acesso operacional';

COMMIT;

-- ======================================================================
-- RESUMO:
-- - Policies operacionais do admin removidas
-- - Permissões operacionais da role admin removidas
-- - Permissões administrativas mantidas (clinicas, entidades)
-- - Comentários das tabelas atualizados
-- ======================================================================

