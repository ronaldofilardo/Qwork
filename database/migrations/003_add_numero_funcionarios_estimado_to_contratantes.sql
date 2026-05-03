-- Migration: Adicionar coluna numero_funcionarios_estimado à tabela contratantes
-- Data: 2026-01-15
-- Descrição: Adiciona campo para armazenar estimativa de funcionários informada no cadastro

-- Adicionar coluna se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contratantes' 
        AND column_name = 'numero_funcionarios_estimado'
    ) THEN
        ALTER TABLE contratantes 
        ADD COLUMN numero_funcionarios_estimado INTEGER NULL;
        
        RAISE NOTICE 'Coluna numero_funcionarios_estimado adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna numero_funcionarios_estimado já existe';
    END IF;
END $$;

-- Verificar resultado
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contratantes' 
AND column_name = 'numero_funcionarios_estimado';
