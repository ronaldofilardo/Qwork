-- MIGRATION 013b: Garantir existencia de nivel_cargo_enum e coluna nivel_cargo (idempotente)
-- Data: 2026-01-23
-- Objetivo: Corrigir ambientes (ex.: bancos de teste) onde o enum ou coluna faltam

BEGIN;

-- 1) Criar enum se não existir (compatível com versões do Postgres que não suportam IF NOT EXISTS em CREATE TYPE)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nivel_cargo_enum') THEN
    EXECUTE $create$CREATE TYPE nivel_cargo_enum AS ENUM ('operacional','gestao')$create$;
  END IF;
END$$;

-- 2) Adicionar coluna se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='funcionarios' AND column_name='nivel_cargo'
  ) THEN
    EXECUTE 'ALTER TABLE funcionarios ADD COLUMN nivel_cargo nivel_cargo_enum';
  END IF;
END$$;

-- 3) Índice (idempotente)
CREATE INDEX IF NOT EXISTS idx_funcionarios_nivel_cargo ON funcionarios (nivel_cargo);

-- 4) Atualizar valores nulos para o padrão onde aplicável
UPDATE funcionarios
SET nivel_cargo = 'operacional'
WHERE nivel_cargo IS NULL
  AND perfil IN ('funcionario','rh');

-- 5) Adicionar CHECK constraint se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'funcionarios_nivel_cargo_check' AND table_name='funcionarios'
  ) THEN
    EXECUTE $create$
      ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_nivel_cargo_check CHECK (
        (perfil IN ('admin','emissor') AND nivel_cargo IS NULL) OR
        (perfil IN ('funcionario','rh') AND nivel_cargo IN ('operacional','gestao'))
      ) NOT VALID;
    $create$;
  END IF;
END$$;

COMMIT;

-- Relatório rápido
SELECT perfil, nivel_cargo, COUNT(*) as total FROM funcionarios GROUP BY perfil, nivel_cargo ORDER BY perfil, nivel_cargo;
