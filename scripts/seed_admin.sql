-- Script para fazer seed do admin padrão
-- CPF: 00000000000
-- Tipo: admin

BEGIN;

-- Inserir admin padrão
INSERT INTO usuarios (
    cpf,
    nome,
    email,
    tipo_usuario,
    ativo
) VALUES (
    '00000000000',
    'Administrador',
    'admin@qwork.com.br',
    'admin',
    true
)
ON CONFLICT (cpf) DO UPDATE SET
    ativo = true,
    atualizado_em = CURRENT_TIMESTAMP;

COMMIT;
