-- Seed: Usuários Suporte e Comercial para Staging
-- Data: 2026-03-31
-- CPF Suporte:   948.365.280-46
-- CPF Comercial: 679.624.950-06
-- Senha (ambos): 5978rdF*
-- Tabela alvo:   funcionarios (login verifica esta tabela primeiro)
-- NOTA: Staging tem constraints legadas conflitantes (perfil_check, nivel_cargo_check,
--       no_gestor_in_funcionarios etc.) que impedem perfis suporte/comercial.
--       Recria com constraint unificada correta.

-- Habilitar extensão pgcrypto (necessária para crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Remover constraints legadas conflitantes
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_nivel_cargo_check;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_perfil_check;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS no_gestor_entidade_in_funcionarios;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS no_gestor_in_funcionarios;

-- Recriar com constraint unificada que suporta todos os perfis do enum
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_nivel_cargo_check CHECK (
  perfil IN ('admin', 'rh', 'emissor', 'gestor', 'suporte', 'comercial', 'vendedor')
  OR (perfil::text = 'funcionario' AND nivel_cargo IS NOT NULL)
);

-- Contexto de sessão exigido pelo trigger de auditoria
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';

-- Usuário Suporte
INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, criado_em, atualizado_em)
VALUES (
  '94836528046',
  'suporte',
  'suporte@qwork.com',
  crypt('5978rdF*', gen_salt('bf')),
  'suporte',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome          = EXCLUDED.nome,
    email         = EXCLUDED.email,
    senha_hash    = EXCLUDED.senha_hash,
    perfil        = EXCLUDED.perfil,
    ativo         = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

-- Usuário Comercial
INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, criado_em, atualizado_em)
VALUES (
  '67962495006',
  'comercial',
  'comercial@qwork.com',
  crypt('5978rdF*', gen_salt('bf')),
  'comercial',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome          = EXCLUDED.nome,
    email         = EXCLUDED.email,
    senha_hash    = EXCLUDED.senha_hash,
    perfil        = EXCLUDED.perfil,
    ativo         = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

COMMIT;

-- Verificação
SELECT cpf, nome, perfil, ativo
FROM funcionarios
WHERE cpf IN ('94836528046', '67962495006')
ORDER BY cpf;
