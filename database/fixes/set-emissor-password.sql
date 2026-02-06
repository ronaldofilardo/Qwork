-- Atualizar hash bcrypt para emissor de teste
UPDATE usuarios
SET senha_hash = '$2a$10$.sxK.w2zOlW2FcMJJX.E6eTMys3cI9xABvtHAZCVsM8B1Byy9n.QK', atualizado_em = NOW()
WHERE cpf = '53051173991'
RETURNING cpf, senha_hash;
