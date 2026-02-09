-- Migration 209: Fix Admin RLS Critical Vulnerabilities
-- Created: 2026-01-29
-- Purpose: Block admin from operational tables + explicit policies

BEGIN;

-- ========================================
-- PART 1: RESTRICTIVE POLICIES - Block admin from sensitive data
-- ========================================

-- Block admin from avaliacoes (LGPD compliance)
DROP POLICY IF EXISTS "avaliacoes_block_admin" ON avaliacoes;
CREATE POLICY "avaliacoes_block_admin" ON avaliacoes
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (current_user_perfil() != 'admin');

-- Block admin from respostas (contains assessment answers)
DROP POLICY IF EXISTS "respostas_block_admin" ON respostas;
CREATE POLICY "respostas_block_admin" ON respostas
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (current_user_perfil() != 'admin');

-- Block admin from resultados (contains individual scores)
DROP POLICY IF EXISTS "resultados_block_admin" ON resultados;
CREATE POLICY "resultados_block_admin" ON resultados
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (current_user_perfil() != 'admin');

-- Block admin from funcionarios data (personal data)
DROP POLICY IF EXISTS "funcionarios_block_admin" ON funcionarios;
CREATE POLICY "funcionarios_block_admin" ON funcionarios
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (current_user_perfil() != 'admin');

-- Block admin from lotes_avaliacao (operational data)
DROP POLICY IF EXISTS "lotes_block_admin" ON lotes_avaliacao;
CREATE POLICY "lotes_block_admin" ON lotes_avaliacao
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (current_user_perfil() != 'admin');

-- Block admin from laudos (contains sensitive documents)
DROP POLICY IF EXISTS "laudos_block_admin" ON laudos;
CREATE POLICY "laudos_block_admin" ON laudos
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (current_user_perfil() != 'admin');

-- Block admin from empresas_clientes (client company data)
DROP POLICY IF EXISTS "empresas_block_admin" ON empresas_clientes;
CREATE POLICY "empresas_block_admin" ON empresas_clientes
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (current_user_perfil() != 'admin');

-- ========================================
-- PART 2: PERMISSIVE POLICIES - Allow admin to administrative tables
-- ========================================

-- Enable RLS on administrative tables first
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin can manage roles
DROP POLICY IF EXISTS "roles_admin_all" ON roles;
CREATE POLICY "roles_admin_all" ON roles
  FOR ALL TO PUBLIC
  USING (current_user_perfil() = 'admin')
  WITH CHECK (current_user_perfil() = 'admin');

-- Admin can manage permissions
DROP POLICY IF EXISTS "permissions_admin_all" ON permissions;
CREATE POLICY "permissions_admin_all" ON permissions
  FOR ALL TO PUBLIC
  USING (current_user_perfil() = 'admin')
  WITH CHECK (current_user_perfil() = 'admin');

-- Admin can manage role_permissions
DROP POLICY IF EXISTS "role_permissions_admin_all" ON role_permissions;
CREATE POLICY "role_permissions_admin_all" ON role_permissions
  FOR ALL TO PUBLIC
  USING (current_user_perfil() = 'admin')
  WITH CHECK (current_user_perfil() = 'admin');

-- Admin can view audit logs (read-only for security)
DROP POLICY IF EXISTS "audit_logs_admin_select" ON audit_logs;
CREATE POLICY "audit_logs_admin_select" ON audit_logs
  FOR SELECT TO PUBLIC
  USING (current_user_perfil() = 'admin');

-- Admin can manage clinicas metadata (not sensitive operational data)
DROP POLICY IF EXISTS "clinicas_admin_all" ON clinicas;
CREATE POLICY "clinicas_admin_all" ON clinicas
  FOR ALL TO PUBLIC
  USING (current_user_perfil() = 'admin')
  WITH CHECK (current_user_perfil() = 'admin');

-- Admin can manage tomadores metadata
DROP POLICY IF EXISTS "tomadores_admin_all" ON tomadores;
CREATE POLICY "tomadores_admin_all" ON tomadores
  FOR ALL TO PUBLIC
  USING (current_user_perfil() = 'admin')
  WITH CHECK (current_user_perfil() = 'admin');

-- ========================================
-- PART 3: VALIDATION
-- ========================================

DO $$
DECLARE
  v_restrictive INTEGER;
  v_permissive INTEGER;
BEGIN
  -- Count RESTRICTIVE policies blocking admin
  SELECT COUNT(*) INTO v_restrictive
  FROM pg_policies
  WHERE tablename IN (
    'avaliacoes', 'respostas', 'resultados', 'funcionarios',
    'lotes_avaliacao', 'laudos', 'empresas_clientes'
  )
  AND policyname LIKE '%block_admin';
  
  IF v_restrictive != 7 THEN
    RAISE EXCEPTION 'Expected 7 RESTRICTIVE policies, found %', v_restrictive;
  END IF;
  
  -- Count PERMISSIVE policies allowing admin
  SELECT COUNT(*) INTO v_permissive
  FROM pg_policies
  WHERE tablename IN (
    'roles', 'permissions', 'role_permissions', 'audit_logs',
    'clinicas', 'tomadores'
  )
  AND policyname LIKE '%admin%';
  
  IF v_permissive < 6 THEN
    RAISE EXCEPTION 'Expected at least 6 PERMISSIVE policies, found %', v_permissive;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 209 completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESTRICTIVE policies: % (block admin from operational data)', v_restrictive;
  RAISE NOTICE 'PERMISSIVE policies: % (allow admin to administrative tables)', v_permissive;
  RAISE NOTICE '========================================';
END $$;

COMMIT;
