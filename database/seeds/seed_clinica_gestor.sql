-- Seed: garante existência da clínica (id=2) e do gestor RH associado (CPF 04703084945)
BEGIN;

-- Inserir/atualizar clínica com id = 2
INSERT INTO clinicas (id, nome, cnpj, email, ativa, criado_em, atualizado_em)
VALUES (
  2,
  'Clínica 2 - Seed',
  '22222222222222',
  'contato@clinica2.test',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE
SET nome = EXCLUDED.nome,
    cnpj = EXCLUDED.cnpj,
    email = EXCLUDED.email,
    ativa = EXCLUDED.ativa,
    atualizado_em = CURRENT_TIMESTAMP;

-- Inserir/atualizar gestor RH para a clínica (CPF de exemplo retirado dos logs)
INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, clinica_id, criado_em, atualizado_em)
VALUES (
  '04703084945',
  'Tania ka',
  'tania.ka@clinica2.test',
  crypt('123', gen_salt('bf')),
  'rh',
  true,
  2,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    senha_hash = EXCLUDED.senha_hash,
    perfil = EXCLUDED.perfil,
    ativo = EXCLUDED.ativo,
    clinica_id = EXCLUDED.clinica_id,
    atualizado_em = CURRENT_TIMESTAMP;

COMMIT;
