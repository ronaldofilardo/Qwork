-- Script para criar usuário admin após limpeza de CNPJs/CPFs
-- Data: 2025-12-21
-- Senha: 123456 (hash bcrypt com 10 rounds)

INSERT INTO funcionarios (
    cpf,
    nome,
    email,
    senha_hash,
    perfil,
    ativo,
    data_nascimento
) VALUES (
    '00000000000',
    'Administrador',
    'admin@bpsbrasil.com.br',
    '$2a$10$1FmG9Rn0QJ9T78GbvS/Yf.AfR9tp9qTxBznhUWLwBhsP8BChtmSVW',
    'admin',
    true,
    '1980-01-01'
) ON CONFLICT (cpf) DO UPDATE SET
    senha_hash = EXCLUDED.senha_hash;

-- Verificar se foi inserido
SELECT cpf, nome, perfil, ativo FROM funcionarios WHERE cpf = '00000000000';