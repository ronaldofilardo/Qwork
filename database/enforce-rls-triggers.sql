CREATE OR REPLACE FUNCTION enforce_rls_for_superuser()
RETURNS trigger AS $$
BEGIN
  IF (SELECT usesuper FROM pg_user WHERE usename = current_user) THEN
    RAISE EXCEPTION 'Superuser bypass of RLS not allowed in test environment';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger em todas as tabelas com RLS
CREATE TRIGGER enforce_rls_funcionarios BEFORE SELECT ON funcionarios
    FOR EACH STATEMENT EXECUTE FUNCTION enforce_rls_for_superuser();

CREATE TRIGGER enforce_rls_avaliacoes BEFORE SELECT ON avaliacoes
    FOR EACH STATEMENT EXECUTE FUNCTION enforce_rls_for_superuser();

CREATE TRIGGER enforce_rls_empresas_clientes BEFORE SELECT ON empresas_clientes
    FOR EACH STATEMENT EXECUTE FUNCTION enforce_rls_for_superuser();

CREATE TRIGGER enforce_rls_lotes_avaliacao BEFORE SELECT ON lotes_avaliacao
    FOR EACH STATEMENT EXECUTE FUNCTION enforce_rls_for_superuser();

CREATE TRIGGER enforce_rls_laudos BEFORE SELECT ON laudos
    FOR EACH STATEMENT EXECUTE FUNCTION enforce_rls_for_superuser();