-- Seed: Usuários para Staging
-- Data: 2026-04-05
-- Ambiente: neondb_staging (Neon Cloud)
-- 
-- Usuários criados:
--   1. Admin: CPF 00000000000, Senha 5978rdF*
--   2. Suporte: CPF 11111111111, Senha Amanda2026*
--   3. Comercial: CPF 22222222222, Senha Talita2026*
--
-- Tabela alvo: usuarios (tipo_usuario_enum)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- PARTE 1: Adicionar valores ao enum usuario_tipo_enum se não existirem
-- NOTA: ALTER TYPE ADD VALUE não pode coexistir com INSERT na mesma transação.
--       Executar aqui fora do BEGIN/COMMIT para auto-commitar antes dos inserts.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'usuario_tipo_enum'::regtype 
    AND enumlabel = 'suporte'
  ) THEN
    ALTER TYPE usuario_tipo_enum ADD VALUE 'suporte';
    RAISE NOTICE 'Adicionado: suporte ao enum usuario_tipo_enum';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'usuario_tipo_enum'::regtype 
    AND enumlabel = 'comercial'
  ) THEN
    ALTER TYPE usuario_tipo_enum ADD VALUE 'comercial';
    RAISE NOTICE 'Adicionado: comercial ao enum usuario_tipo_enum';
  END IF;
END $$;

-- =============================================================================
-- PARTE 2: Inserções de usuários
-- =============================================================================

BEGIN;

-- Contexto de sessão (exigido por triggers de auditoria)
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';

-- Admin
INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
VALUES (
  '00000000000',
  'Admin',
  'admin@qwork.local',
  'admin'::usuario_tipo_enum,
  crypt('5978rdF*', gen_salt('bf')),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome              = EXCLUDED.nome,
    email             = EXCLUDED.email,
    tipo_usuario      = EXCLUDED.tipo_usuario,
    senha_hash        = EXCLUDED.senha_hash,
    ativo             = EXCLUDED.ativo,
    atualizado_em     = CURRENT_TIMESTAMP;

-- Suporte
INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
VALUES (
  '11111111111',
  'Suporte',
  'suporte@qwork.local',
  'suporte'::usuario_tipo_enum,
  crypt('Amanda2026*', gen_salt('bf')),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome              = EXCLUDED.nome,
    email             = EXCLUDED.email,
    tipo_usuario      = EXCLUDED.tipo_usuario,
    senha_hash        = EXCLUDED.senha_hash,
    ativo             = EXCLUDED.ativo,
    atualizado_em     = CURRENT_TIMESTAMP;

-- Comercial
INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
VALUES (
  '22222222222',
  'Comercial',
  'comercial@qwork.local',
  'comercial'::usuario_tipo_enum,
  crypt('Talita2026*', gen_salt('bf')),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome              = EXCLUDED.nome,
    email             = EXCLUDED.email,
    tipo_usuario      = EXCLUDED.tipo_usuario,
    senha_hash        = EXCLUDED.senha_hash,
    ativo             = EXCLUDED.ativo,
    atualizado_em     = CURRENT_TIMESTAMP;

COMMIT;

-- =============================================================================
-- Verificação final
-- =============================================================================

SELECT cpf, nome, tipo_usuario, ativo
FROM usuarios
WHERE cpf IN ('00000000000', '11111111111', '22222222222')
ORDER BY cpf;
