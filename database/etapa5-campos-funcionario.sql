-- ETAPA 5: Novos campos funcionário
-- Adicionar matricula, nivel_cargo, turno, escala

-- 1. Criar enum para nivel_cargo
CREATE TYPE nivel_cargo_enum AS ENUM ('operacional', 'gestao');

-- 2. Adicionar novas colunas na tabela funcionarios
ALTER TABLE funcionarios
ADD COLUMN matricula VARCHAR(20) UNIQUE,
ADD COLUMN nivel_cargo nivel_cargo_enum,
ADD COLUMN turno VARCHAR(50),
ADD COLUMN escala VARCHAR(50);

-- 3. Criar índices para performance
CREATE INDEX idx_funcionarios_matricula ON funcionarios (matricula);

CREATE INDEX idx_funcionarios_nivel_cargo ON funcionarios (nivel_cargo);

-- 4. Atualizar funcionários existentes com dados teste
-- Funcionários da Clínica 1
UPDATE funcionarios
SET
    matricula = 'MAT001',
    nivel_cargo = 'operacional',
    turno = 'Manhã',
    escala = '8x40'
WHERE
    cpf = '12345678901';
-- João Silva

UPDATE funcionarios
SET
    matricula = 'MAT002',
    nivel_cargo = 'gestao',
    turno = 'Comercial',
    escala = '8x44'
WHERE
    cpf = '11122233344';
-- Carlos Oliveira

-- Funcionários da Clínica 2
UPDATE funcionarios
SET
    matricula = 'MAT003',
    nivel_cargo = 'operacional',
    turno = 'Tarde',
    escala = '12x36'
WHERE
    cpf = '55555555555';
-- Funcionário ABC

UPDATE funcionarios
SET
    matricula = 'MAT004',
    nivel_cargo = 'gestao',
    turno = 'Comercial',
    escala = '8x44'
WHERE
    cpf = '98765432100';
-- Maria Santos

-- 5. Tornar nivel_cargo obrigatório para funcionários (não admin/rh)
ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_nivel_cargo_check CHECK (
    perfil IN ('admin', 'rh')
    OR (
        perfil = 'funcionario'
        AND nivel_cargo IS NOT NULL
    )
);

-- 6. Verificar estrutura atualizada
SELECT '=== FUNCIONÁRIOS COM NOVOS CAMPOS ===' as titulo;

SELECT f.cpf, f.nome, f.matricula, f.nivel_cargo, f.turno, f.escala, f.setor, f.funcao, ec.nome as empresa, f.perfil
FROM
    funcionarios f
    LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id
WHERE
    f.perfil = 'funcionario'
ORDER BY f.clinica_id, f.matricula;

-- 7. Verificar constraint funcionando
SELECT '=== RESUMO NÍVEIS DE CARGO ===' as titulo;

SELECT
    nivel_cargo,
    COUNT(*) as total_funcionarios
FROM funcionarios
WHERE
    perfil = 'funcionario'
GROUP BY
    nivel_cargo
ORDER BY nivel_cargo;

SELECT '✅ ETAPA 5.1 CONCLUÍDA - NOVOS CAMPOS ADICIONADOS!' as resultado;