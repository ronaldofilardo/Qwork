-- Criar usuário gestor para entidade RELEGERE (id=100)
-- CPF: 29930511059
-- CNPJ: 02494916000170
-- Senha: 000170 (6 últimos dígitos do CNPJ)

BEGIN;

-- 1. Criar usuário na tabela usuarios
INSERT INTO usuarios (
  id,
  cpf,
  nome,
  email,
  entidade_id,
  clinica_id,
  ativo,
  tipo_usuario,
  criado_em,
  atualizado_em
) VALUES (
  4,
  '29930511059',
  'Gestor RLGR',
  'rhrlge@kdke.com',
  100,
  NULL,
  true,
  'gestor',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
  cpf = EXCLUDED.cpf,
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  entidade_id = EXCLUDED.entidade_id,
  ativo = EXCLUDED.ativo,
  tipo_usuario = EXCLUDED.tipo_usuario,
  atualizado_em = CURRENT_TIMESTAMP;

-- 2. Criar senha na tabela entidades_senhas (DELETE se já existir)
-- Senha: 000170 (hash bcrypt)
DELETE FROM entidades_senhas WHERE entidade_id = 100;

INSERT INTO entidades_senhas (
  entidade_id,
  cpf,
  senha_hash,
  criado_em,
  atualizado_em
) VALUES (
  100,
  '29930511059',  -- CPF do responsável
  '$2a$10$aLYeDmWcuSkamyX5qsq0leqlPW2PcvUXNkw3xOAKHyzC.YVaUcueC',  -- hash de '000170'
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- 3. Atualizar entidade para marcar como ativa
UPDATE entidades 
SET 
  ativa = true,
  data_liberacao_login = CURRENT_TIMESTAMP,
  atualizado_em = CURRENT_TIMESTAMP
WHERE id = 100;

COMMIT;

-- CREDENCIAIS DE ACESSO:
-- Login: 29930511059 (CPF do responsável)
-- Senha: 000170 (6 últimos dígitos do CNPJ)
