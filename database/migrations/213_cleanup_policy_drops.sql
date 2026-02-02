-- Migration 213: Cleanup Incorrect DROP POLICY Statements
-- Created: 2026-01-29
-- Purpose: Document and prevent future DROP POLICY on wrong tables

BEGIN;

-- ========================================
-- PART 1: Audit existing policies
-- ========================================

-- Create temp table to track expected policies
CREATE TEMP TABLE expected_policies AS
SELECT 
  'avaliacoes' as tablename, 'avaliacoes_own_select' as policyname UNION ALL
SELECT 'avaliacoes', 'avaliacoes_own_insert' UNION ALL
SELECT 'avaliacoes', 'avaliacoes_own_update' UNION ALL
SELECT 'avaliacoes', 'avaliacoes_rh_clinica' UNION ALL
SELECT 'avaliacoes', 'avaliacoes_block_admin' UNION ALL
SELECT 'respostas', 'respostas_own_select' UNION ALL
SELECT 'respostas', 'respostas_own_insert' UNION ALL
SELECT 'respostas', 'respostas_own_update' UNION ALL
SELECT 'respostas', 'respostas_rh_clinica' UNION ALL
SELECT 'respostas', 'respostas_block_admin' UNION ALL
SELECT 'resultados', 'resultados_own_select' UNION ALL
SELECT 'resultados', 'resultados_rh_clinica' UNION ALL
SELECT 'resultados', 'resultados_block_admin' UNION ALL
SELECT 'funcionarios', 'funcionarios_own_select' UNION ALL
SELECT 'funcionarios', 'funcionarios_own_update' UNION ALL
SELECT 'funcionarios', 'funcionarios_rh_clinica' UNION ALL
SELECT 'funcionarios', 'funcionarios_rh_insert' UNION ALL
SELECT 'funcionarios', 'funcionarios_rh_update' UNION ALL
SELECT 'funcionarios', 'funcionarios_block_admin' UNION ALL
SELECT 'lotes_avaliacao', 'lotes_rh_clinica' UNION ALL
SELECT 'lotes_avaliacao', 'lotes_rh_insert' UNION ALL
SELECT 'lotes_avaliacao', 'lotes_rh_update' UNION ALL
SELECT 'lotes_avaliacao', 'lotes_emissor_select' UNION ALL
SELECT 'lotes_avaliacao', 'lotes_funcionario_select' UNION ALL
SELECT 'lotes_avaliacao', 'lotes_block_admin' UNION ALL
SELECT 'laudos', 'laudos_emissor_select' UNION ALL
SELECT 'laudos', 'laudos_emissor_insert' UNION ALL
SELECT 'laudos', 'laudos_emissor_update' UNION ALL
SELECT 'laudos', 'laudos_rh_clinica' UNION ALL
SELECT 'laudos', 'laudos_block_admin' UNION ALL
SELECT 'empresas_clientes', 'empresas_rh_clinica' UNION ALL
SELECT 'empresas_clientes', 'empresas_rh_insert' UNION ALL
SELECT 'empresas_clientes', 'empresas_rh_update' UNION ALL
SELECT 'empresas_clientes', 'empresas_block_admin' UNION ALL
SELECT 'clinicas', 'clinicas_own_select' UNION ALL
SELECT 'clinicas', 'clinicas_admin_all' UNION ALL
SELECT 'contratantes', 'contratantes_admin_all' UNION ALL
SELECT 'roles', 'roles_admin_all' UNION ALL
SELECT 'permissions', 'permissions_admin_all' UNION ALL
SELECT 'role_permissions', 'role_permissions_admin_all' UNION ALL
SELECT 'audit_logs', 'audit_logs_admin_select';

-- Log unexpected policies (not in our expected list)
INSERT INTO audit_logs (
  user_cpf,
  user_perfil,
  action,
  resource,
  details
)
SELECT
  '00000000000',
  'system',
  'POLICY_UNEXPECTED',
  p.tablename,
  'Unexpected policy: ' || p.policyname || ' on table ' || p.tablename
FROM pg_policies p
WHERE NOT EXISTS (
  SELECT 1 FROM expected_policies e
  WHERE e.tablename = p.tablename
    AND e.policyname = p.policyname
);

-- ========================================
-- PART 2: Create validation function
-- ========================================

CREATE OR REPLACE FUNCTION validate_policy_table_match(
  p_policy_name TEXT,
  p_table_name TEXT
)
RETURNS boolean AS $$
DECLARE
  v_policy_table TEXT;
BEGIN
  -- Extract table name from policy name
  -- Pattern: <table>_<perfil>_<action>
  -- Example: avaliacoes_own_select -> table should be avaliacoes
  
  v_policy_table := split_part(p_policy_name, '_', 1);
  
  -- Special cases with compound names
  IF p_policy_name LIKE 'lotes_%' THEN
    v_policy_table := 'lotes_avaliacao';
  ELSIF p_policy_name LIKE 'empresas_%' THEN
    v_policy_table := 'empresas_clientes';
  END IF;
  
  -- Validate match
  IF v_policy_table != p_table_name THEN
    RAISE WARNING 'Policy name "%" suggests table "%" but applied to table "%"',
      p_policy_name, v_policy_table, p_table_name;
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_policy_table_match(TEXT, TEXT) IS
  'Validates that policy name matches target table name.
   Use in migrations before DROP/CREATE POLICY.
   Example: validate_policy_table_match(''avaliacoes_own_select'', ''avaliacoes'')';

-- ========================================
-- PART 3: Create helper for safe policy management
-- ========================================

CREATE OR REPLACE FUNCTION safe_drop_policy(
  p_policy_name TEXT,
  p_table_name TEXT
)
RETURNS void AS $$
BEGIN
  -- Validate match first
  IF NOT validate_policy_table_match(p_policy_name, p_table_name) THEN
    RAISE EXCEPTION 'Policy name "%" does not match table "%". Check migration code.',
      p_policy_name, p_table_name;
  END IF;
  
  -- Drop policy
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy_name, p_table_name);
  
  -- Log
  RAISE NOTICE 'Dropped policy "%" from table "%"', p_policy_name, p_table_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION safe_drop_policy(TEXT, TEXT) IS
  'Safely drops a policy after validating name matches table.
   Use this in migrations instead of DROP POLICY directly.
   Example: SELECT safe_drop_policy(''avaliacoes_own_select'', ''avaliacoes'')';

-- ========================================
-- PART 4: Documentation
-- ========================================

-- Create guidelines document in database
CREATE TABLE IF NOT EXISTS migration_guidelines (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  guideline TEXT NOT NULL,
  example TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO migration_guidelines (category, guideline, example) VALUES
(
  'RLS_POLICY',
  'Always match policy name with table name',
  E'-- WRONG:\nDROP POLICY IF EXISTS "avaliacoes_own_select" ON funcionarios;\n\n-- CORRECT:\nDROP POLICY IF EXISTS "avaliacoes_own_select" ON avaliacoes;'
),
(
  'RLS_POLICY',
  'Use safe_drop_policy() function in migrations',
  E'-- SAFE (validates before dropping):\nSELECT safe_drop_policy(''avaliacoes_own_select'', ''avaliacoes'');\n\n-- This will fail if policy name does not match table:\nSELECT safe_drop_policy(''avaliacoes_own_select'', ''funcionarios'');\n-- ERROR: Policy name does not match table'
),
(
  'RLS_POLICY',
  'Policy naming convention: <table>_<perfil>_<action>',
  E'avaliacoes_own_select    -- funcionario SELECT on avaliacoes\navaliacoes_rh_clinica    -- RH SELECT on avaliacoes\nlotes_emissor_select     -- emissor SELECT on lotes_avaliacao\nempresas_block_admin     -- RESTRICTIVE blocking admin'
);

-- ========================================
-- PART 5: VALIDATION
-- ========================================

DO $$
DECLARE
  v_unexpected INTEGER;
BEGIN
  -- Count unexpected policies
  SELECT COUNT(*) INTO v_unexpected
  FROM pg_policies p
  WHERE NOT EXISTS (
    SELECT 1 FROM expected_policies e
    WHERE e.tablename = p.tablename
      AND e.policyname = p.policyname
  );
  
  IF v_unexpected > 0 THEN
    RAISE NOTICE 'Found % unexpected policies (logged to audit_logs)', v_unexpected;
  ELSE
    RAISE NOTICE 'All policies match expected configuration';
  END IF;
  
  -- Validate helper functions exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'validate_policy_table_match'
  ) THEN
    RAISE EXCEPTION 'FAILED: validate_policy_table_match function not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'safe_drop_policy'
  ) THEN
    RAISE EXCEPTION 'FAILED: safe_drop_policy function not created';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 213 completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created validation functions:';
  RAISE NOTICE '  - validate_policy_table_match()';
  RAISE NOTICE '  - safe_drop_policy()';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Use in future migrations:';
  RAISE NOTICE '  SELECT safe_drop_policy(''policy_name'', ''table_name'');';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Guidelines stored in migration_guidelines table';
  RAISE NOTICE '  SELECT * FROM migration_guidelines;';
  RAISE NOTICE '========================================';
END $$;

COMMIT;
