-- Script para criar usuário gestor necessário para teste
-- CPF: 80510620949 - João da Lagos (Gestor)

INSERT INTO funcionarios (
    cpf,
    nome,
    email,
    senha_hash,
    perfil,
    usuario_tipo,
    contratante_id,
    ativo,
    criado_em,
    atualizado_em
) VALUES (
    '80510620949',
    'João da Lagos',
    'joao.lagos@email.com',
    '$2a$10$7VOFZGC2.aJozBaascY3Zu6zWPEocQe0PWQ3Dd4laAT83cLN/F9Ya', -- senha: 123
    'gestor',
    'gestor',
    1, -- entidade_id (assumindo que existe)
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (cpf) DO NOTHING;

-- Verificar inserção
SELECT cpf, nome, usuario_tipo, contratante_id FROM funcionarios WHERE cpf = '80510620949';