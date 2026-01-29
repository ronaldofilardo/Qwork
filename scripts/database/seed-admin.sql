-- Script para criar admin seed
-- Senha: 123456 (hash bcrypt)
-- Criado em: 2026-01-07

INSERT INTO administradores (
  cpf,
  nome,
  email,
  senha_hash,
  clinica_id,
  ativo,
  criado_em,
  atualizado_em,
  criado_por,
  data_consentimento,
  ip_consentimento,
  base_legal
) VALUES (
  '00000000000',
  'Administrador',
  'admin@bps.com.br',
  '$2a$10$AFmk4XTCxuL1pSChreTjSOk/eGzDspkMRj9qMa7TYJMisBbrigvlq',
  NULL, -- Admin global, não vinculado a clínica
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL,
  CURRENT_TIMESTAMP,
  '127.0.0.1'::inet,
  'contrato'
) ON CONFLICT (cpf) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  senha_hash = EXCLUDED.senha_hash,
  clinica_id = EXCLUDED.clinica_id,
  ativo = EXCLUDED.ativo,
  atualizado_em = CURRENT_TIMESTAMP,
  data_consentimento = EXCLUDED.data_consentimento,
  ip_consentimento = EXCLUDED.ip_consentimento,
  base_legal = EXCLUDED.base_legal;

-- Verificar se foi inserido
SELECT
  cpf,
  nome,
  email,
  clinica_id,
  ativo,
  criado_em
FROM administradores
WHERE cpf = '00000000000';