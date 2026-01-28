-- Fix: remover clinica_id de funcionários que apontam para clinicas inexistentes
-- Mostra os registros afetados (verificar antes de aplicar)
BEGIN;

-- Listar funcionários com clinica_id órfã
SELECT f.cpf, f.nome, f.clinica_id
FROM funcionarios f
LEFT JOIN clinicas c ON c.id = f.clinica_id
WHERE f.clinica_id IS NOT NULL AND c.id IS NULL;

-- Ação recomendada: limpar clinica_id (faz safe-fix) - COMMIT quando revisado
-- UPDATE funcionarios SET clinica_id = NULL WHERE clinica_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM clinicas WHERE id = funcionarios.clinica_id);

COMMIT;