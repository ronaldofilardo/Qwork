-- Correção final das senhas com hashes bcrypt corretos
-- Qwork - Etapa 1

UPDATE funcionarios
SET
    senha_hash = '$2a$10$2feBm6EH/lCkk2a4SCwY2OA5BHvaZ.N47BAO2eLTZADX2GCMi28tm'
WHERE
    cpf = '00000000000';

-- Administrador: CPF 11111111111, senha: admin123
UPDATE funcionarios
SET
    senha_hash = '$2a$10$7qd.fn9BsAxHapShBPr1OeCRtzoDY75MP4bDQ3YIf1k23LpcoS9Pe'
WHERE
    cpf = '11111111111';

-- RH Gestor: CPF 22222222222, senha: rh123
UPDATE funcionarios
SET
    senha_hash = '$2a$10$9qF7Y/zsk0wigtA4BboQgOcyd/lzebSVfNo5kyEpDR5CUF9OOUrIC'
WHERE
    cpf = '22222222222';

-- Verificar os 3 usuários principais
SELECT
    cpf,
    nome,
    perfil,
    ativo,
    CASE
        WHEN cpf = '11111111111' THEN 'admin123'
        WHEN cpf = '22222222222' THEN 'rh123'
        ELSE 'N/A'
    END as senha_correta
FROM funcionarios
WHERE
    cpf IN (
        '00000000000',
        '11111111111',
        '22222222222'
    )
ORDER BY cpf;