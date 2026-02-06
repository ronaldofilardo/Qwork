-- ====================================================================
-- Migration: 1004 - Adicionar coluna usuario_tipo em funcionarios
-- Criado em: 2026-02-02
-- Objetivo: Garantir que a coluna usuario_tipo existe na tabela funcionarios
--           com o tipo correto (usuario_tipo_enum) e NOT NULL
-- ====================================================================
-- IMPORTANTE: Esta migração é idempotente e pode ser executada múltiplas vezes

BEGIN;

-- Criar ENUM se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usuario_tipo_enum') THEN
        CREATE TYPE usuario_tipo_enum AS ENUM (
            'funcionario_clinica',
            'funcionario_entidade',
            'rh',
            'gestor',
            'admin',
            'emissor'
        );
        RAISE NOTICE 'ENUM usuario_tipo_enum criado';
    END IF;
END $$;

-- Adicionar coluna usuario_tipo se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funcionarios' 
        AND column_name = 'usuario_tipo'
    ) THEN
        -- Adicionar com DEFAULT temporário para permitir NOT NULL
        ALTER TABLE funcionarios 
        ADD COLUMN usuario_tipo usuario_tipo_enum NOT NULL DEFAULT 'funcionario_entidade';
        
        -- Remover DEFAULT após inserção
        ALTER TABLE funcionarios 
        ALTER COLUMN usuario_tipo DROP DEFAULT;
        
        RAISE NOTICE 'Coluna usuario_tipo adicionada';
    END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_funcionarios_usuario_tipo 
ON funcionarios(usuario_tipo);

CREATE INDEX IF NOT EXISTS idx_funcionarios_contratante_usuario_tipo 
ON funcionarios(contratante_id, usuario_tipo);

COMMIT;
