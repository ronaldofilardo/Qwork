-- Seed: criar admin com CPF 8754572902

-- Inserir admin na tabela usuarios
INSERT INTO usuarios (cpf, nome, role, ativo, criado_em)
VALUES (
  '8754572902',
  'Ronaldo Administrador',
  'admin',
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome = EXCLUDED.nome,
    role = EXCLUDED.role,
    ativo = EXCLUDED.ativo;

-- Verificar se foi inserido
SELECT cpf, nome, role, ativo FROM usuarios WHERE cpf = '8754572902';