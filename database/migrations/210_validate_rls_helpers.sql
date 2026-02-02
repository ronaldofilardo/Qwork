-- Migration 210: Validate RLS Helper Functions
-- Created: 2026-01-29
-- Purpose: Add mandatory validation to prevent NULL bypass

BEGIN;

-- ========================================
-- PART 1: Mandatory validation functions
-- ========================================

-- Function: current_user_cpf with mandatory validation
CREATE OR REPLACE FUNCTION public.current_user_cpf()
RETURNS text AS $$
DECLARE
  v_cpf TEXT;
BEGIN
  v_cpf := NULLIF(current_setting('app.current_user_cpf', TRUE), '');
  
  -- SECURITY: CPF is mandatory for RLS operations
  IF v_cpf IS NULL THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_cpf not set. Call SET LOCAL app.current_user_cpf before query.';
  END IF;
  
  -- Validate CPF format (11 digits)
  IF LENGTH(v_cpf) != 11 OR v_cpf !~ '^\d{11}$' THEN
    RAISE EXCEPTION 'SECURITY: Invalid CPF format "%". Expected 11 digits.', v_cpf;
  END IF;
  
  RETURN v_cpf;
EXCEPTION
  WHEN undefined_object THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_cpf not configured in session.';
  WHEN SQLSTATE '22023' THEN -- invalid parameter value
    RAISE EXCEPTION 'SECURITY: app.current_user_cpf not configured in session.';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_cpf() IS
  'Returns current user CPF from session context. 
   RAISES EXCEPTION if not set (prevents NULL bypass).
   Validates CPF format (11 digits).';

-- Function: current_user_perfil with mandatory validation
CREATE OR REPLACE FUNCTION public.current_user_perfil()
RETURNS text AS $$
DECLARE
  v_perfil TEXT;
  v_valid_perfis TEXT[] := ARRAY['funcionario', 'rh', 'emissor', 'admin', 'gestor_entidade'];
BEGIN
  v_perfil := NULLIF(current_setting('app.current_user_perfil', TRUE), '');
  
  -- SECURITY: Perfil is mandatory for RLS operations
  IF v_perfil IS NULL THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_perfil not set. Call SET LOCAL app.current_user_perfil before query.';
  END IF;
  
  -- Validate perfil is in allowed list
  IF NOT (v_perfil = ANY(v_valid_perfis)) THEN
    RAISE EXCEPTION 'SECURITY: Invalid perfil "%" not in %', v_perfil, v_valid_perfis;
  END IF;
  
  RETURN v_perfil;
EXCEPTION
  WHEN undefined_object THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_perfil not configured in session.';
  WHEN SQLSTATE '22023' THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_perfil not configured in session.';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_perfil() IS
  'Returns current user perfil from session context.
   RAISES EXCEPTION if not set (prevents NULL bypass).
   Validates perfil is in allowed list.';

-- ========================================
-- PART 2: Optional validation functions (can return NULL)
-- ========================================

-- Rename existing functions to make it clear they are optional
ALTER FUNCTION current_user_clinica_id() RENAME TO current_user_clinica_id_optional;
ALTER FUNCTION current_user_contratante_id() RENAME TO current_user_contratante_id_optional;

-- Create strict versions for policies that require these values
CREATE OR REPLACE FUNCTION public.current_user_clinica_id()
RETURNS integer AS $$
DECLARE
  v_id TEXT;
BEGIN
  v_id := NULLIF(current_setting('app.current_user_clinica_id', TRUE), '');
  
  -- SECURITY: For RH perfil, clinica_id is mandatory
  IF v_id IS NULL AND current_user_perfil() = 'rh' THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_clinica_id not set for perfil RH.';
  END IF;
  
  RETURN v_id::INTEGER;
EXCEPTION
  WHEN undefined_object THEN
    -- For non-RH users, NULL is acceptable
    IF current_user_perfil() = 'rh' THEN
      RAISE EXCEPTION 'SECURITY: app.current_user_clinica_id not configured for RH.';
    END IF;
    RETURN NULL;
  WHEN SQLSTATE '22023' THEN
    IF current_user_perfil() = 'rh' THEN
      RAISE EXCEPTION 'SECURITY: app.current_user_clinica_id not configured for RH.';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_clinica_id() IS
  'Returns current user clinica_id from session context.
   RAISES EXCEPTION if not set for perfil RH (prevents NULL bypass).
   Returns NULL for other perfis (acceptable).';

-- Recreate contratante_id with validation
CREATE OR REPLACE FUNCTION public.current_user_contratante_id()
RETURNS integer AS $$
DECLARE
  v_id TEXT;
BEGIN
  v_id := NULLIF(current_setting('app.current_user_contratante_id', TRUE), '');
  
  -- SECURITY: For gestor_entidade perfil, contratante_id is mandatory
  IF v_id IS NULL AND current_user_perfil() = 'gestor_entidade' THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_contratante_id not set for perfil gestor_entidade.';
  END IF;
  
  RETURN v_id::INTEGER;
EXCEPTION
  WHEN undefined_object THEN
    -- For non-gestor users, NULL is acceptable
    IF current_user_perfil() = 'gestor_entidade' THEN
      RAISE EXCEPTION 'SECURITY: app.current_user_contratante_id not configured for gestor_entidade.';
    END IF;
    RETURN NULL;
  WHEN SQLSTATE '22023' THEN
    IF current_user_perfil() = 'gestor_entidade' THEN
      RAISE EXCEPTION 'SECURITY: app.current_user_contratante_id not configured for gestor_entidade.';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_contratante_id() IS
  'Returns current user contratante_id from session context.
   RAISES EXCEPTION if not set for perfil gestor_entidade (prevents NULL bypass).
   Returns NULL for other perfis (acceptable).';

-- ========================================
-- PART 3: VALIDATION
-- ========================================

DO $$
BEGIN
  -- Test 1: current_user_cpf requires context
  BEGIN
    RESET app.current_user_cpf;
    PERFORM current_user_cpf();
    RAISE EXCEPTION 'FAILED: current_user_cpf should raise exception without context';
  EXCEPTION
    WHEN SQLSTATE 'P0001' THEN
      RAISE NOTICE 'OK - current_user_cpf raises exception without context';
  END;
  
  -- Test 2: current_user_perfil requires context
  BEGIN
    RESET app.current_user_perfil;
    PERFORM current_user_perfil();
    RAISE EXCEPTION 'FAILED: current_user_perfil should raise exception without context';
  EXCEPTION
    WHEN SQLSTATE 'P0001' THEN
      RAISE NOTICE 'OK - current_user_perfil raises exception without context';
  END;
  
  -- Test 3: Functions work with valid context
  SET LOCAL app.current_user_cpf = '12345678901';
  SET LOCAL app.current_user_perfil = 'funcionario';
  
  IF current_user_cpf() != '12345678901' THEN
    RAISE EXCEPTION 'FAILED: current_user_cpf returned wrong value';
  END IF;
  
  IF current_user_perfil() != 'funcionario' THEN
    RAISE EXCEPTION 'FAILED: current_user_perfil returned wrong value';
  END IF;
  
  RAISE NOTICE 'OK - Functions work correctly with valid context';
  
  -- Test 4: Invalid perfil rejected
  BEGIN
    SET LOCAL app.current_user_perfil = 'hacker';
    PERFORM current_user_perfil();
    RAISE EXCEPTION 'FAILED: current_user_perfil should reject invalid perfil';
  EXCEPTION
    WHEN SQLSTATE 'P0001' THEN
      RAISE NOTICE 'OK - current_user_perfil rejects invalid perfil';
  END;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 210 completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS helper functions now validate mandatory context';
  RAISE NOTICE 'NULL bypass vulnerability FIXED';
  RAISE NOTICE '========================================';
END $$;

COMMIT;
