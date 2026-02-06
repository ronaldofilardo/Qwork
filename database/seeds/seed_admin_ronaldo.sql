-- Seed: Admin Ronaldo para desenvolvimento
-- CPF: 87545772920
-- Nome: Ronaldo
-- Email: admin@qwork.com
-- Perfil: admin
-- Senha: admin123 (para desenvolvimento)

-- Habilitar pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Remover constraint temporariamente
ALTER TABLE public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;

-- Inserir admin (desabilitando RLS via SET)
SET row_security = off;

INSERT INTO public.funcionarios (cpf, nome, email, perfil, senha_hash, ativo, criado_em, atualizado_em)
VALUES (
  '87545772920',
  'Ronaldo',
  'admin@qwork.com',
  'admin',
  public.crypt('admin123', public.gen_salt('bf'::text)),
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

-- Recriar constraint permitindo admin sem clínica
ALTER TABLE public.funcionarios
  ADD CONSTRAINT funcionarios_clinica_check
  CHECK (clinica_id IS NOT NULL OR entidade_id IS NOT NULL OR perfil IN ('emissor', 'admin', 'gestao'));

-- Resetar RLS
RESET row_security;