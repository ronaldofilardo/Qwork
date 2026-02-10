-- ====================================================================
-- Migration 1005b: Corrigir TODAS as FK de laudos.emissor_cpf
-- Data: 2026-02-10
-- Objetivo: Remover todas as constraints que apontam para funcionarios
--           e criar apenas UMA apontando para usuarios
-- ====================================================================

BEGIN;

-- Listar todas as constraints de emissor_cpf em laudos
-- Para produção: verificar quais existem
DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'laudos'::regclass 
        AND conname LIKE '%emissor%'
    LOOP
        RAISE NOTICE 'Dropando constraint: %', constraint_name;
        EXECUTE format('ALTER TABLE laudos DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name);
    END LOOP;
END $$;

-- Criar nova constraint única apontando para usuarios
ALTER TABLE laudos
ADD CONSTRAINT fk_laudos_emissor_cpf 
FOREIGN KEY (emissor_cpf) 
REFERENCES usuarios(cpf) 
ON DELETE RESTRICT;

-- Adicionar comentário
COMMENT ON CONSTRAINT fk_laudos_emissor_cpf ON laudos IS 
'Garante que emissor existe na tabela usuarios. RESTRICT previne deleção de emissor com laudos.';

COMMIT;

-- Verificação
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'laudos'::regclass 
AND conname LIKE '%emissor%';
