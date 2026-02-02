-- Migration 207: Helper function current_user_contratante_id
BEGIN;
CREATE OR REPLACE FUNCTION public.current_user_contratante_id()
RETURNS INTEGER AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_contratante_id', TRUE), '')::INTEGER;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
SELECT 'OK - Helper function criada!' as status;
COMMIT;
