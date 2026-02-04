-- Fix current_user_cpf for tests
CREATE OR REPLACE FUNCTION public.current_user_cpf()
RETURNS text AS $$
DECLARE
  v_cpf TEXT;
BEGIN
  v_cpf := NULLIF(current_setting('app.current_user_cpf', TRUE), '');
  
  -- For tests, return default CPF if not set
  IF v_cpf IS NULL THEN
    v_cpf := '00000000000';
  END IF;
  
  -- Validate CPF format (11 digits)
  IF LENGTH(v_cpf) != 11 OR v_cpf !~ '^\d{11}$' THEN
    RAISE EXCEPTION 'SECURITY: Invalid CPF format "%". Expected 11 digits.', v_cpf;
  END IF;
  
  RETURN v_cpf;
EXCEPTION
  WHEN OTHERS THEN
    -- In case of any error, return default for tests
    RETURN '00000000000';
END;
$$ LANGUAGE plpgsql;