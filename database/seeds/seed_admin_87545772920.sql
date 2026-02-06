-- Seed do usuário admin com CPF 87545772920 e senha 5978rdf
-- Hash gerado com bcrypt (cost 10): $2a$10$ebsMgQSEX3Wyx0vbRYu8b.kFx85.5S5cFJJVBySt2l1pn9GYXX3tm

-- Habilitar extensão pgcrypto se não existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Set session variables so audit triggers can run without failing
PERFORM set_config('app.current_user_cpf', '87545772920', true);
PERFORM set_config('app.current_user_perfil', 'admin', true);

INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
VALUES (
  '87545772920',
  'Admin',
  'admin@bps.com.br',
  'admin',
  '$2a$10$ebsMgQSEX3Wyx0vbRYu8b.kFx85.5S5cFJJVBySt2l1pn9GYXX3tm',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  tipo_usuario = EXCLUDED.tipo_usuario,
  senha_hash = EXCLUDED.senha_hash,
  ativo = EXCLUDED.ativo,
  atualizado_em = CURRENT_TIMESTAMP;

-- Verificar inserção
SELECT cpf, nome, email, tipo_usuario FROM usuarios WHERE cpf = '87545772920';

COMMIT;