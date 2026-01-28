-- Correção das senhas hasheadas corretamente
-- Qwork - Correção dos usuários Etapa 1

UPDATE funcionarios
SET
    senha_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE
    cpf = '00000000000';

-- Atualizar senha do Admin para 'admin123'
UPDATE funcionarios
SET
    senha_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    perfil = 'admin',
    nome = 'Administrador Clínica'
WHERE
    cpf = '11111111111';

-- Atualizar senha do RH para 'rh123'
UPDATE funcionarios
SET
    senha_hash = '$2a$10$CwTycUXWue0Thq9StjUM0uyhHS5MiGOvMQP.2UUvMSpmeMM3V0.xO',
    nome = 'RH Gestor'
WHERE
    cpf = '22222222222';

-- Verificar os usuários atualizados
SELECT cpf, nome, perfil, ativo
FROM funcionarios
WHERE
    cpf IN (
        '00000000000',
        '11111111111',
        '22222222222'
    )
ORDER BY cpf;