-- Script para corrigir todas as senhas hash dos usuários

-- Gerar hashes corretas
UPDATE funcionarios
SET
    senha_hash = '$2a$10$jslNqlvuCyeNibvDArgEx.OAlWip4CZFFxIyVQUgRMzviB.kqMTKe'
WHERE
    cpf = '00000000000';

-- Admin Clínica 1 (CPF: 11111111111, senha: admin123)
UPDATE funcionarios
SET
    senha_hash = '$2a$10$RoZFITAppqKWE9IIjc79o.qZ8NSG5EnpU10bwVucHh5AyxkgSBNSy'
WHERE
    cpf = '11111111111';

-- RH Clínica 1 (CPF: 22222222222, senha: rh123) - já corrigido
-- Admin Clínica 2 (CPF: 33333333333, senha: admin123)
UPDATE funcionarios
SET
    senha_hash = '$2a$10$RoZFITAppqKWE9IIjc79o.qZ8NSG5EnpU10bwVucHh5AyxkgSBNSy'
WHERE
    cpf = '33333333333';

-- RH Clínica 2 (CPF: 44444444444, senha: rh123)
UPDATE funcionarios
SET
    senha_hash = '$2a$10$Z4ZKDa/YHNoDlR9L11Z0qemVhjBXYGvTXYj6PHYWjFLq2tvV/0H/G'
WHERE
    cpf = '44444444444';

-- Funcionário Clínica 2 (CPF: 55555555555, senha: func123)
UPDATE funcionarios
SET
    senha_hash = '$2a$10$0PO1.5NFcfpLMzfX99BOsOrxmlpe24Bxo.oIV7l1JsGtRByWSLH0e'
WHERE
    cpf = '55555555555';

-- Verificar todas as atualizações
SELECT
    cpf,
    nome,
    perfil,
    clinica_id,
    substring(senha_hash, 1, 10) as hash_prefix
FROM funcionarios
WHERE
    perfil != 'funcionario'
    OR cpf IN ('55555555555')
ORDER BY clinica_id NULLS FIRST, perfil;

SELECT '✅ TODAS AS SENHAS CORRIGIDAS COM SUCESSO!' as resultado;
