-- Seed: usuários de teste para desenvolvimento
-- Admin: 00000000000 / 0000
-- Suporte: 11111111111 / 1111
-- Comercial: 22222222222 / 2222
-- Emissor: 53051173991 / 5978rdF*

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Set session context para triggers de auditoria
PERFORM set_config('app.current_user_cpf', '00000000000', true);
PERFORM set_config('app.current_user_perfil', 'admin', true);

-- Admin
INSERT INTO usuarios (cpf, nome, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
VALUES (
  '00000000000',
  'Admin Dev',
  'admin'::usuario_tipo_enum,
  crypt('0000', gen_salt('bf')),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome = EXCLUDED.nome,
    tipo_usuario = EXCLUDED.tipo_usuario,
    senha_hash = EXCLUDED.senha_hash,
    ativo = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

-- Suporte
INSERT INTO usuarios (cpf, nome, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
VALUES (
  '11111111111',
  'Suporte Dev',
  'suporte'::usuario_tipo_enum,
  crypt('1111', gen_salt('bf')),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome = EXCLUDED.nome,
    tipo_usuario = EXCLUDED.tipo_usuario,
    senha_hash = EXCLUDED.senha_hash,
    ativo = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

-- Comercial
INSERT INTO usuarios (cpf, nome, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
VALUES (
  '22222222222',
  'Comercial Dev',
  'comercial'::usuario_tipo_enum,
  crypt('2222', gen_salt('bf')),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome = EXCLUDED.nome,
    tipo_usuario = EXCLUDED.tipo_usuario,
    senha_hash = EXCLUDED.senha_hash,
    ativo = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

-- Emissor
INSERT INTO usuarios (cpf, nome, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
VALUES (
  '53051173991',
  'Emissor Dev',
  'emissor'::usuario_tipo_enum,
  '$2a$10$zTIIh6sOBFHDyBUUxkXdAOctTQsS1xyuUvusaHZKVVhnfCKMU2fP.',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome = EXCLUDED.nome,
    tipo_usuario = EXCLUDED.tipo_usuario,
    senha_hash = EXCLUDED.senha_hash,
    ativo = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

COMMIT;

-- Confirmação
SELECT cpf, nome, tipo_usuario FROM usuarios 
WHERE cpf IN ('00000000000', '11111111111', '22222222222', '53051173991')
ORDER BY cpf;

