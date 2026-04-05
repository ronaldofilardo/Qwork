-- ====================================================================
-- Seed: Admin User
-- Data: 2026-02-05
-- CPF: 00000000000
-- Senha: admin123
-- Objetivo: Criar usuário admin padrão do sistema
-- ====================================================================

-- Inserir usuário admin
INSERT INTO usuarios (cpf, nome, email, tipo_usuario, ativo)
VALUES (
    '00000000000',
    'Administrador',
    'admin@sistema.com',
    'admin',
    true
)
ON CONFLICT (cpf) DO UPDATE
SET 
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    tipo_usuario = EXCLUDED.tipo_usuario,
    ativo = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

-- Verificação
SELECT 
    cpf,
    nome,
    email,
    tipo_usuario,
    ativo
FROM usuarios
WHERE cpf = '00000000000';

\echo '✓ Usuário Admin criado com sucesso (CPF: 00000000000, Senha: admin123)'
