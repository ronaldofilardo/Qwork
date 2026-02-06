-- Migration: Adicionar coluna numero_funcionarios_estimado à tabela entidades
-- Data: 2026-01-15
-- Descrição: Adiciona campo para armazenar estimativa de funcionários informada no cadastro
-- Nota: Tabela renomeada de 'contratantes' para 'entidades' na Migration 420

-- Adicionar coluna se não existir
DO $$
BEGIN
    -- Tentar na nova tabela 'entidades' primeiro
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades') THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'entidades' 
            AND column_name = 'numero_funcionarios_estimado'
        ) THEN
            ALTER TABLE entidades 
            ADD COLUMN numero_funcionarios_estimado INTEGER NULL;
            RAISE NOTICE 'Coluna numero_funcionarios_estimado adicionada à tabela entidades';
        ELSE
            RAISE NOTICE 'Coluna numero_funcionarios_estimado já existe na tabela entidades';
        END IF;
    -- Fallback para tabela antiga 'contratantes' (se ainda não foi renomeada)
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratantes') THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'contratantes' 
            AND column_name = 'numero_funcionarios_estimado'
        ) THEN
            ALTER TABLE contratantes 
            ADD COLUMN numero_funcionarios_estimado INTEGER NULL;
            RAISE NOTICE 'Coluna numero_funcionarios_estimado adicionada à tabela contratantes (será renomeada para entidades na Migration 420)';
        ELSE
            RAISE NOTICE 'Coluna numero_funcionarios_estimado já existe';
        END IF;
    ELSE
        RAISE EXCEPTION 'Nenhuma das tabelas entidades ou contratantes existe';
    END IF;
END $$;

-- Verificar resultado (tenta ambas as tabelas)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades') THEN
        RAISE NOTICE 'Verificando na tabela entidades...';
        PERFORM column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'entidades' 
        AND column_name = 'numero_funcionarios_estimado';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratantes') THEN
        RAISE NOTICE 'Verificando na tabela contratantes...';
        PERFORM column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'contratantes' 
        AND column_name = 'numero_funcionarios_estimado';
    END IF;
END $$;
