-- Seed do usuário admin com senha 123456
-- Hash gerado com bcrypt (cost 10)

-- Primeiro, gerar o hash da senha 123456
-- O hash bcrypt de '123456' é: $2a$10$MtvAixafFzBg4GDi8dvvOOSQ0GK7Hgihhgmy2oOWKEZZuQj0gvNDq

INSERT INTO funcionarios (
  cpf, nome, email, senha_hash, perfil, clinica_id, empresa_id,
  matricula, nivel_cargo, turno, escala, setor, funcao
) VALUES (
  '00000000000',
  'Admin',
  'admin@bps.com.br',
  '$2a$10$MtvAixafFzBg4GDi8dvvOOSQ0GK7Hgihhgmy2oOWKEZZuQj0gvNDq',
  'admin',
  2,  -- Usar clínica existente no banco de teste
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'Administracao',
  'Administrador do Sistema'
)
ON CONFLICT (cpf) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  senha_hash = EXCLUDED.senha_hash,
  perfil = EXCLUDED.perfil,
  clinica_id = EXCLUDED.clinica_id,
  empresa_id = EXCLUDED.empresa_id,
  matricula = EXCLUDED.matricula,
  nivel_cargo = EXCLUDED.nivel_cargo,
  turno = EXCLUDED.turno,
  escala = EXCLUDED.escala,
  setor = EXCLUDED.setor,
  funcao = EXCLUDED.funcao,
  atualizado_em = CURRENT_TIMESTAMP;

-- Verificar inserção
SELECT cpf, nome, email, perfil FROM funcionarios WHERE cpf = '00000000000';
