-- ETAPA 4: Vincular Funcionários à Empresa Cliente
-- Adicionar campo empresa_id na tabela funcionarios

-- 1. Adicionar coluna empresa_id na tabela funcionarios
ALTER TABLE funcionarios ADD COLUMN empresa_id INTEGER;

-- 2. Criar chave estrangeira para empresas_clientes
ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas_clientes (id) ON DELETE SET NULL;

-- 3. Criar índice para performance
CREATE INDEX idx_funcionarios_empresa ON funcionarios (empresa_id);

-- 4. Atualizar funcionários existentes para vincular às empresas teste
-- Funcionários da Clínica 1 → Indústria Metalúrgica (empresa_id = 1)
UPDATE funcionarios
SET
    empresa_id = 1
WHERE
    clinica_id = 1
    AND perfil = 'funcionario';

-- Funcionários da Clínica 2 → Construtora ABC (empresa_id = 2)
UPDATE funcionarios
SET
    empresa_id = 2
WHERE
    clinica_id = 2
    AND perfil = 'funcionario';

-- 5. Criar funcionários teste vinculados às empresas
-- Funcionário teste para Indústria Metalúrgica (Clínica 1)
INSERT INTO
    funcionarios (
        cpf,
        nome,
        setor,
        funcao,
        email,
        senha_hash,
        perfil,
        clinica_id,
        empresa_id
    )
VALUES (
        '12345678901',
        'João Silva',
        'Produção',
        'Operador de Máquinas',
        'joao.silva@metalurgicasp.com.br',
        '$2a$10$0PO1.5NFcfpLMzfX99BOsOrxmlpe24Bxo.oIV7l1JsGtRByWSLH0e',
        'funcionario',
        1,
        1
    );

-- Funcionário teste para Construtora ABC (Clínica 2)
INSERT INTO
    funcionarios (
        cpf,
        nome,
        setor,
        funcao,
        email,
        senha_hash,
        perfil,
        clinica_id,
        empresa_id
    )
VALUES (
        '98765432100',
        'Maria Santos',
        'Engenharia',
        'Engenheira Civil',
        'maria.santos@construtorabc.com.br',
        '$2a$10$0PO1.5NFcfpLMzfX99BOsOrxmlpe24Bxo.oIV7l1JsGtRByWSLH0e',
        'funcionario',
        2,
        2
    );

-- Funcionário teste para Tech Solutions (Clínica 1)
INSERT INTO
    funcionarios (
        cpf,
        nome,
        setor,
        funcao,
        email,
        senha_hash,
        perfil,
        clinica_id,
        empresa_id
    )
VALUES (
        '11122233344',
        'Carlos Oliveira',
        'TI',
        'Desenvolvedor',
        'carlos.oliveira@techsolutions.com.br',
        '$2a$10$0PO1.5NFcfpLMzfX99BOsOrxmlpe24Bxo.oIV7l1JsGtRByWSLH0e',
        'funcionario',
        1,
        3
    );

-- 6. Verificar estrutura atualizada
SELECT '=== FUNCIONÁRIOS COM EMPRESAS ===' as titulo;

SELECT
    f.cpf,
    f.nome as funcionario,
    f.setor,
    f.funcao,
    ec.nome as empresa,
    c.nome as clinica,
    f.perfil
FROM
    funcionarios f
    LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id
    LEFT JOIN clinicas c ON f.clinica_id = c.id
WHERE
    f.perfil = 'funcionario'
ORDER BY c.nome, ec.nome, f.nome;

SELECT '=== RESUMO POR EMPRESA ===' as titulo;

SELECT
    c.nome as clinica,
    ec.nome as empresa,
    COUNT(f.id) as total_funcionarios
FROM
    empresas_clientes ec
    LEFT JOIN funcionarios f ON ec.id = f.empresa_id
    JOIN clinicas c ON ec.clinica_id = c.id
GROUP BY
    c.nome,
    ec.nome
ORDER BY c.nome, ec.nome;

SELECT '✅ ETAPA 4.1 CONCLUÍDA - RELACIONAMENTO FUNCIONÁRIO-EMPRESA CRIADO!' as resultado;