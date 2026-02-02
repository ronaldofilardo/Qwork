-- Seed: Admin para produção Neon
-- CPF: 00000000000
-- Senha: 5978rdf

-- Habilitar extensão pgcrypto se não existir (necessária para crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Desabilitar triggers de auditoria temporariamente
ALTER TABLE funcionarios DISABLE TRIGGER ALL;

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

-- Reabilitar triggers de auditoria
ALTER TABLE funcionarios ENABLE TRIGGER ALL;

COMMIT;
