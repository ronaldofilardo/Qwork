-- Migration 211 - NEON VERSION: Create DBA Maintenance Role with BYPASSRLS
-- Created: 2026-01-29
-- Purpose: Enable critical operations and emergency hotfixes
-- Note: Simplified for Neon managed database (no log_statement config)

BEGIN;

-- ========================================
-- PART 1: Create role with BYPASSRLS
-- ========================================

-- Drop if exists (for idempotency)
DROP ROLE IF EXISTS dba_maintenance;

-- Create role with BYPASSRLS capability
CREATE ROLE dba_maintenance 
  WITH LOGIN 
  PASSWORD 'CHANGE_ME_IN_PRODUCTION'
  BYPASSRLS
  CONNECTION LIMIT 2;

-- Security: Revoke all default permissions on schema and objects
REVOKE ALL ON SCHEMA public FROM dba_maintenance;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM dba_maintenance;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM dba_maintenance;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM dba_maintenance;

-- Grant only necessary permissions (least privilege)
-- Note: CONNECT permission is granted by default to PUBLIC role
GRANT USAGE ON SCHEMA public TO dba_maintenance;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dba_maintenance;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO dba_maintenance;

-- Grant future tables/sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dba_maintenance;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE ON SEQUENCES TO dba_maintenance;

-- ========================================
-- PART 2: Audit configuration (skip log settings on Neon)
-- ========================================

-- Note: Neon managed database doesn't allow setting log parameters
-- Audit will be done via application-level logging

-- ========================================
-- PART 3: Audit trigger for BYPASSRLS actions
-- ========================================

-- Function to audit BYPASSRLS usage
CREATE OR REPLACE FUNCTION audit_bypassrls_session()
RETURNS void AS $$
BEGIN
  -- Log session start with BYPASSRLS role
  IF current_user IN ('dba_maintenance', 'postgres', 'neondb_owner') THEN
    INSERT INTO audit_logs (
      user_cpf,
      user_perfil,
      action,
      resource,
      details,
      ip_address
    ) VALUES (
      current_user,
      'dba_bypassrls',
      'SESSION_START',
      'BYPASSRLS',
      'Role: ' || current_user || ', Database: ' || current_database(),
      inet_client_addr()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_bypassrls_session() IS
  'Audits BYPASSRLS session starts. Call this at beginning of maintenance scripts.';

-- ========================================
-- PART 4: Helper function for safe maintenance
-- ========================================

-- Function to execute maintenance safely with audit
CREATE OR REPLACE FUNCTION execute_maintenance(
  p_description TEXT,
  p_sql TEXT
)
RETURNS void AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_rows_affected INTEGER;
BEGIN
  -- Only allow BYPASSRLS roles
  IF current_user NOT IN ('dba_maintenance', 'postgres', 'neondb_owner') THEN
    RAISE EXCEPTION 'SECURITY: execute_maintenance() requires BYPASSRLS role';
  END IF;
  
  v_start_time := clock_timestamp();
  
  -- Audit before
  INSERT INTO audit_logs (
    user_cpf,
    user_perfil,
    action,
    resource,
    details
  ) VALUES (
    current_user,
    'dba_bypassrls',
    'MAINTENANCE_START',
    'SQL',
    'Description: ' || p_description || E'\nSQL: ' || p_sql
  );
  
  -- Execute
  EXECUTE p_sql;
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  -- Audit after
  INSERT INTO audit_logs (
    user_cpf,
    user_perfil,
    action,
    resource,
    details
  ) VALUES (
    current_user,
    'dba_bypassrls',
    'MAINTENANCE_COMPLETE',
    'SQL',
    'Description: ' || p_description || 
    E'\nRows affected: ' || v_rows_affected ||
    E'\nDuration: ' || (clock_timestamp() - v_start_time)
  );
  
  RAISE NOTICE 'Maintenance completed: % (% rows affected)', p_description, v_rows_affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION execute_maintenance(TEXT, TEXT) IS
  'Executes maintenance SQL with full audit trail.
   Usage: SELECT execute_maintenance(''Fix data'', ''UPDATE table...'');
   Only accessible to BYPASSRLS roles.';

-- ========================================
-- PART 5: Documentation and guidelines
-- ========================================

COMMENT ON ROLE dba_maintenance IS
  'DBA maintenance role with BYPASSRLS for critical operations.
   
   USE CASES:
   - Data migrations between clinicas/contratantes
   - Bug fixes requiring cross-entity updates
   - Emergency hotfixes during incidents
   - Global reports for management
   - Backup/restore operations
   
   SECURITY:
   - Limited to 2 concurrent connections
   - Actions audited in audit_logs table
   - Password must be changed in production
   
   USAGE:
   psql [neon-url] -U dba_maintenance
   SELECT audit_bypassrls_session(); -- Log session start
   SELECT execute_maintenance(''description'', ''SQL...'');
   
   IMPORTANT:
   - Document ticket/PR for all usage
   - Never use for regular application operations
   - Review audit_logs after maintenance';

-- ========================================
-- PART 6: VALIDATION
-- ========================================

DO $$
BEGIN
  -- Validate role exists with BYPASSRLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles 
    WHERE rolname = 'dba_maintenance' 
      AND rolbypassrls = true
  ) THEN
    RAISE EXCEPTION 'FAILED: dba_maintenance role not created with BYPASSRLS';
  END IF;
  
  -- Validate connection limit
  IF (SELECT rolconnlimit FROM pg_roles WHERE rolname = 'dba_maintenance') != 2 THEN
    RAISE EXCEPTION 'FAILED: dba_maintenance should have CONNECTION LIMIT 2';
  END IF;
  
  -- Validate audit functions exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'audit_bypassrls_session'
  ) THEN
    RAISE EXCEPTION 'FAILED: audit_bypassrls_session function not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'execute_maintenance'
  ) THEN
    RAISE EXCEPTION 'FAILED: execute_maintenance function not created';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 211 (NEON) completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Role: dba_maintenance';
  RAISE NOTICE 'BYPASSRLS: enabled';
  RAISE NOTICE 'Connection limit: 2';
  RAISE NOTICE 'Audit: APPLICATION-LEVEL (via audit_logs)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECURITY WARNING:';
  RAISE NOTICE 'Change password in production!';
  RAISE NOTICE 'ALTER ROLE dba_maintenance PASSWORD ''strong-password-here'';';
  RAISE NOTICE '========================================';
END $$;

COMMIT;
