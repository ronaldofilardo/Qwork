/**
 * Migration 1235: Remove Legacy Planos Tables
 * 
 * This migration removes the deprecated planos system that was never used in production.
 * All APIs, tests, and library functions referencing planos have been removed.
 * Only database tables remain as legacy artifacts.
 * 
 * Tables removed:
 * - historico_contratos_planos (depends on contratos_planos)
 * - auditoria_planos (depends on planos)
 * - contratos_planos (depends on planos)
 * - planos
 * 
 * Triggers and functions that depend on these tables will be automatically dropped.
 * 
 * Date: 2026-05-03
 */

-- First, drop any triggers that depend on these tables
DO $$ 
BEGIN
  -- Drop triggers on planos table
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trg_audit_planos') THEN
    DROP TRIGGER IF EXISTS trg_audit_planos ON planos;
  END IF;
  
  -- Drop triggers on contratos_planos table
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trg_audit_contratos_planos') THEN
    DROP TRIGGER IF EXISTS trg_audit_contratos_planos ON contratos_planos;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trg_historico_contratos_planos') THEN
    DROP TRIGGER IF EXISTS trg_historico_contratos_planos ON contratos_planos;
  END IF;
  
  -- Drop functions that may depend on these tables
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'fn_audit_contratos_planos') THEN
    DROP FUNCTION IF EXISTS fn_audit_contratos_planos() CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'fn_historico_contratos_planos') THEN
    DROP FUNCTION IF EXISTS fn_historico_contratos_planos() CASCADE;
  END IF;
END $$;

-- Drop any views that reference these tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_planos') THEN
    DROP VIEW IF EXISTS v_planos CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_contratos_planos') THEN
    DROP VIEW IF EXISTS v_contratos_planos CASCADE;
  END IF;
END $$;

-- Drop any RLS policies on these tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_policy WHERE polname LIKE '%planos%') THEN
    DROP POLICY IF EXISTS "planos_select" ON planos;
    DROP POLICY IF EXISTS "planos_insert" ON planos;
    DROP POLICY IF EXISTS "planos_update" ON planos;
    DROP POLICY IF EXISTS "planos_delete" ON planos;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_policy WHERE polname LIKE '%contratos_planos%') THEN
    DROP POLICY IF EXISTS "contratos_planos_select" ON contratos_planos;
    DROP POLICY IF EXISTS "contratos_planos_insert" ON contratos_planos;
    DROP POLICY IF EXISTS "contratos_planos_update" ON contratos_planos;
    DROP POLICY IF EXISTS "contratos_planos_delete" ON contratos_planos;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_policy WHERE polname LIKE '%auditoria_planos%') THEN
    DROP POLICY IF EXISTS "auditoria_planos_select" ON auditoria_planos;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_policy WHERE polname LIKE '%historico_contratos_planos%') THEN
    DROP POLICY IF EXISTS "historico_contratos_planos_select" ON historico_contratos_planos;
  END IF;
END $$;

-- Drop the tables in the correct dependency order
-- historico_contratos_planos depends on contratos_planos
DROP TABLE IF EXISTS historico_contratos_planos CASCADE;

-- auditoria_planos depends on planos
DROP TABLE IF EXISTS auditoria_planos CASCADE;

-- contratos_planos depends on planos
DROP TABLE IF EXISTS contratos_planos CASCADE;

-- planos can be dropped last
DROP TABLE IF EXISTS planos CASCADE;

-- Drop any sequences created for these tables
DROP SEQUENCE IF EXISTS planos_id_seq CASCADE;
DROP SEQUENCE IF EXISTS contratos_planos_id_seq CASCADE;
DROP SEQUENCE IF EXISTS auditoria_planos_id_seq CASCADE;
DROP SEQUENCE IF EXISTS historico_contratos_planos_id_seq CASCADE;

-- Verify removal
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_name IN ('planos', 'contratos_planos', 'auditoria_planos', 'historico_contratos_planos');
  
  IF v_count = 0 THEN
    RAISE NOTICE '✓ Migration 1235 complete: All legacy planos tables removed successfully';
  ELSE
    RAISE WARNING '⚠ Migration 1235: %s tables still exist after removal', v_count;
  END IF;
END $$;
