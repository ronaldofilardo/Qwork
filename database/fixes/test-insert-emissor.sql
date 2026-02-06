-- Teste de inserção de emissor na tabela usuarios
-- Executado: 2026-02-05

-- Inserir emissor de teste
INSERT INTO usuarios (
  cpf,
  nome,
  email,
  role,
  senha_hash,
  ativo,
  criado_em,
  atualizado_em
)
VALUES (
  '53051173991',
  'Emissor Teste',
  'emissor.teste@example.com',
  'emissor',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeJ5rFxs3FqQp1BpJ3xNmvKwCz0VrN3Lm', -- senha: 123456
  true,
  NOW(),
  NOW()
)
ON CONFLICT (cpf) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  senha_hash = EXCLUDED.senha_hash,
  ativo = EXCLUDED.ativo,
  atualizado_em = CURRENT_TIMESTAMP
RETURNING cpf, nome, email, role;

-- Verificar se foi criado
SELECT cpf, nome, email, role, ativo, criado_em 
FROM usuarios 
WHERE cpf = '53051173991';
