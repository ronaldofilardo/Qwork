-- MIGRATION 013: Tornar nivel_cargo NOT NULL e adicionar validacao
-- Data: 2025-12-20
-- Descricao: O campo nivel_cargo deve ser obrigatorio para todos os funcionarios
--            (exceto admin e emissor que nao sao funcionarios operacionais).
--            Adiciona CHECK constraint para validar valores.

BEGIN;

-- 1. Verificar se a constraint ja existe
DO $$
DECLARE
    v_constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'funcionarios_nivel_cargo_check'
        AND table_name = 'funcionarios'
    ) INTO v_constraint_exists;

    IF v_constraint_exists THEN
        RAISE NOTICE 'Constraint funcionarios_nivel_cargo_check ja existe - pulando criacao';
        RETURN;
    END IF;
END $$;

-- 2. Atualizar funcionarios com nivel_cargo NULL para 'operacional' (valor padrao)
-- Apenas para perfil 'funcionario' e 'rh'
UPDATE funcionarios
SET nivel_cargo = 'operacional'
WHERE nivel_cargo IS NULL
  AND perfil IN ('funcionario', 'rh');

-- 3. Verificar se ainda existem NULLs problematicos
DO $$
DECLARE
    v_null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_null_count
    FROM funcionarios
    WHERE nivel_cargo IS NULL
      AND perfil IN ('funcionario', 'rh');

    IF v_null_count > 0 THEN
        RAISE EXCEPTION 'Ainda existem % funcionarios sem nivel_cargo', v_null_count;
    END IF;

    RAISE NOTICE 'Todos os funcionarios possuem nivel_cargo definido';
END $$;

-- 4. Adicionar CHECK constraint para validar nivel_cargo
-- Admin e emissor podem ter NULL, mas funcionario e RH devem ter valor
ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_nivel_cargo_check
CHECK (
    (perfil IN ('admin', 'emissor') AND nivel_cargo IS NULL) OR
    (perfil IN ('funcionario', 'rh') AND nivel_cargo IN ('operacional', 'gestao'))
);

-- 5. Verificar constraint aplicada
DO $$
DECLARE
    v_constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'funcionarios_nivel_cargo_check'
        AND table_name = 'funcionarios'
    ) INTO v_constraint_exists;

    IF v_constraint_exists THEN
        RAISE NOTICE 'Constraint funcionarios_nivel_cargo_check criada com sucesso';
    ELSE
        RAISE EXCEPTION 'Falha ao criar constraint';
    END IF;
END $$;

COMMIT;

-- 6. Estatisticas finais
SELECT
    perfil,
    nivel_cargo,
    COUNT(*) as total
FROM funcionarios
GROUP BY perfil, nivel_cargo
ORDER BY perfil, nivel_cargo;
