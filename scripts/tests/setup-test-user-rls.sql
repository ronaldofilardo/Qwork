-- Script: Teste RLS com usuário não-superusuário
-- Superusuários (postgres) bypassam RLS por padrão

BEGIN;

-- Criar usuário de teste se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'test_user_rls') THEN
    CREATE USER test_user_rls WITH PASSWORD 'test123';
  END IF;
END $$;

-- Conceder permissões necessárias
GRANT CONNECT ON DATABASE nr-bps_db_test TO test_user_rls;
GRANT USAGE ON SCHEMA public TO test_user_rls;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO test_user_rls;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO test_user_rls;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO test_user_rls;

COMMIT;

SELECT 'Usuário test_user_rls criado com sucesso. Execute os testes com este usuário.' as resultado;

-- Para testar, use:
-- psql -U test_user_rls -d nr-bps_db_test -f test-rls-policies.sql
