-- MIGRATION 013c: Remover nivel_cargo de perfis que não devem tê-lo (rh, gestor_entidade) e ajustar constraint
-- Data: 2026-01-23
-- Objetivo: Corrigir atribuição indevida de nivel_cargo para perfis de gestão (rh, gestor_entidade)

BEGIN;

-- 1) Limpar valores indevidos
UPDATE funcionarios
SET nivel_cargo = NULL
WHERE perfil IN ('rh', 'gestor_entidade')
  AND nivel_cargo IS NOT NULL;

-- 2) Substituir constraint existente por versão correta (somente 'funcionario' exige nivel_cargo)
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_nivel_cargo_check;

ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_nivel_cargo_check CHECK (
    (perfil IN ('admin','emissor','rh','gestor_entidade') AND nivel_cargo IS NULL) OR
    (perfil = 'funcionario' AND nivel_cargo IN ('operacional','gestao'))
  ) NOT VALID;

COMMIT;

-- Relatório
SELECT perfil, nivel_cargo, COUNT(*) as total FROM funcionarios GROUP BY perfil, nivel_cargo ORDER BY perfil, nivel_cargo;