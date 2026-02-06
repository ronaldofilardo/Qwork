-- Atualiza ou insere a senha bcrypt para o RH (CPF 04703084945) na tabela clinicas_senhas
BEGIN;

WITH upsert AS (
  UPDATE clinicas_senhas
  SET senha_hash = '$2a$10$sQdtQSbtaLWzqg1ygjYBquxO8JuLpF.fpE.gorSkb/oFW/abuLyaK',
      atualizado_em = NOW(),
      updated_at = NOW()
  WHERE clinica_id = 7 AND cpf = '04703084945'
  RETURNING *
)
INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada, created_at, updated_at, criado_em, atualizado_em)
SELECT 7, '04703084945', '$2a$10$sQdtQSbtaLWzqg1ygjYBquxO8JuLpF.fpE.gorSkb/oFW/abuLyaK', false, NOW(), NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM upsert);

COMMIT;

-- Senha em texto: "000191" (final do CNPJ da clínica). Hash usado gerado localmente.
