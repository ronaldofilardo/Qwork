-- Atualize os hashes das senhas dos usuários de teste Qwork
-- Execute este script dentro do psql conectado ao banco nr-bps_db

UPDATE funcionarios
SET
    senha_hash = '$2a$10$WHURjBEKPfux/HK606Wp..DtD/xEorCy9TH2kqaMtUv5Z.OHnYjfm'
WHERE
    cpf = '00000000000';

UPDATE funcionarios
SET
    senha_hash = '$2a$10$kQVvn1IJ402LndW65Hy27Oi.kKX2uIHkaWtLa0FzZg/Ah9EwcIcY6'
WHERE
    cpf = '11111111111';

UPDATE funcionarios
SET
    senha_hash = '$2a$10$xcC3a.zOVJppLri6EioFIeKU1HueUaXrQ9t/TrfXdeN7rSUvLdvy.'
WHERE
    cpf = '22222222222';

-- Verifique se os hashes foram atualizados corretamente
SELECT cpf, senha_hash FROM funcionarios;