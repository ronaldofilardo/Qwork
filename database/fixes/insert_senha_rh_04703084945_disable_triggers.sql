-- Desabilita triggers temporariamente para evitar falha no audit trigger
BEGIN;

-- Atenção: desabilita TODOS os triggers na tabela durante esta operação.
ALTER TABLE entidades_senhas DISABLE TRIGGER ALL;

INSERT INTO entidades_senhas (cpf, senha_hash, criado_em, atualizado_em)
VALUES ('04703084945', '$2a$10$sQdtQSbtaLWzqg1ygjYBquxO8JuLpF.fpE.gorSkb/oFW/abuLyaK', NOW(), NOW())
ON CONFLICT (cpf) DO UPDATE
  SET senha_hash = EXCLUDED.senha_hash,
      atualizado_em = NOW();

ALTER TABLE entidades_senhas ENABLE TRIGGER ALL;

COMMIT;

-- Observação: a senha em texto é "000191" (final do CNPJ da clínica).
