-- Seed: Admin para produção Neon
-- CPF: 00000000000
-- Senha: 5978rdf
-- Versão modificada: não desabilita triggers de sistema

-- Habilitar extensão pgcrypto se não existir (necessária para crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Desabilitar apenas triggers de usuário (não os de sistema/RI)
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN (
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'funcionarios'::regclass 
        AND tgname NOT LIKE 'RI_%' 
        AND tgname NOT LIKE 'pg_%'
        AND tgisinternal = false
    )
    LOOP
        EXECUTE 'ALTER TABLE funcionarios DISABLE TRIGGER ' || quote_ident(rec.tgname);
    END LOOP;
END
$$;

-- Inserir admin
INSERT INTO funcionarios (cpf, nome, email, perfil, senha_hash, ativo, criado_em, atualizado_em)
VALUES (
  '00000000000',
  'Admin Sistema',
  'admin@qwork.com',
  'admin',
  crypt('5978rdf', gen_salt('bf')),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    perfil = EXCLUDED.perfil,
    senha_hash = EXCLUDED.senha_hash,
    ativo = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

-- Reabilitar triggers de usuário
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN (
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'funcionarios'::regclass 
        AND tgname NOT LIKE 'RI_%' 
        AND tgname NOT LIKE 'pg_%'
        AND tgisinternal = false
    )
    LOOP
        EXECUTE 'ALTER TABLE funcionarios ENABLE TRIGGER ' || quote_ident(rec.tgname);
    END LOOP;
END
$$;

COMMIT;

-- Verificar
SELECT cpf, nome, email, perfil, ativo, criado_em 
FROM funcionarios 
WHERE cpf = '00000000000';

\echo '✓ Admin criado com sucesso (CPF: 00000000000, Senha: 5978rdf)'
