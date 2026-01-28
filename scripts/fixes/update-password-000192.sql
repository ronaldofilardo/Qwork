-- Atualizar senha para 000192 (6 últimos dígitos do CNPJ)
UPDATE funcionarios
SET senha_hash = '$2a$10$3.jnfWSyjV5cqDKHd6LIOuArNTBXsINboF7ZmWdTWYW27ZLOE8.f.'
WHERE cpf = '84666497005';