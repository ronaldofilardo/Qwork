-- Desabilitar RLS em todas as tabelas para testes
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN (
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
  )
  LOOP
    EXECUTE 'ALTER TABLE IF EXISTS ' || quote_ident(t) || ' DISABLE ROW LEVEL SECURITY';
  END LOOP;
END
$$;

SELECT 'RLS desabilitado para testes' as resultado;
