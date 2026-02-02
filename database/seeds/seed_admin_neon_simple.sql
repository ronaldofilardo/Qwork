-- Seed: Admin para produção Neon (simplificado)
-- CPF: 00000000000  
-- Senha: 5978rdf

-- Habilitar pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Bypass RLS temporariamente (SET LOCAL afeta apenas esta transação)
SET LOCAL row_security = off;

-- Desabilitar triggers temporariamente
ALTER TABLE public.funcionarios DISABLE TRIGGER ALL;

-- Desabilitar constraint temporariamente (admin não precisa de clínica)
ALTER TABLE public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;

-- Inserir admin do sistema (sem vínculo a clínica)
INSERT INTO public.funcionarios (cpf, nome, email, perfil, senha_hash, ativo, criado_em, atualizado_em)
VALUES (
  '00000000000',
  'Admin Sistema',
  'admin@qwork.com',
  'admin',
  public.crypt('5978rdf', public.gen_salt('bf'::text)),
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

-- Reabilitar triggers
ALTER TABLE public.funcionarios ENABLE TRIGGER ALL;

-- Recriar constraint permitindo admin sem clínica
ALTER TABLE public.funcionarios 
  ADD CONSTRAINT funcionarios_clinica_check 
  CHECK (clinica_id IS NOT NULL OR perfil IN ('emissor', 'admin'));

COMMIT;
