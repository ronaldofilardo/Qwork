-- ====================================================================
-- Script de Sincronização da Tabela funcionarios (Local → Neon)
-- Criado em: 2026-02-02
-- Objetivo: Sincronizar completamente a estrutura da tabela funcionarios
--           entre o banco local (nr-bps_db) e o banco Neon (produção)
-- ====================================================================

BEGIN;

-- ====================================================================
-- PARTE 1: Criar ENUM usuario_tipo_enum se não existir
-- ====================================================================
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
    ELSE
        RAISE NOTICE 'ENUM usuario_tipo_enum já existe';
    END IF;
END $$;

-- ====================================================================
-- PARTE 2: Adicionar coluna usuario_tipo (CRÍTICO - falta no Neon)
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funcionarios' 
        AND column_name = 'usuario_tipo'
    ) THEN
        ALTER TABLE funcionarios 
        ADD COLUMN usuario_tipo usuario_tipo_enum NOT NULL DEFAULT 'funcionario_entidade';
        
        RAISE NOTICE 'Coluna usuario_tipo adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna usuario_tipo já existe';
    END IF;
END $$;

-- ====================================================================
-- PARTE 3: Remover DEFAULT após inserção (manter NOT NULL sem default)
-- ====================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funcionarios' 
        AND column_name = 'usuario_tipo'
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE funcionarios 
        ALTER COLUMN usuario_tipo DROP DEFAULT;
        
        RAISE NOTICE 'DEFAULT removido de usuario_tipo';
    ELSE
        RAISE NOTICE 'usuario_tipo já está sem DEFAULT';
    END IF;
END $$;

-- ====================================================================
-- PARTE 4: Ajustar tipo de nivel_cargo (varchar → enum)
-- ====================================================================
-- Observação: No Neon está como nivel_cargo_enum, no local como varchar
-- Vamos manter compatibilidade com o que o Neon já tem (enum)
-- Sem alteração necessária aqui - o Neon já está correto

-- ====================================================================
-- PARTE 5: Remover colunas extras que existem no Neon mas não no Local
-- ====================================================================
-- IMPORTANTE: Essas colunas existem no Neon mas NÃO no banco local:
-- - incluido_em
-- - inativado_em  
-- - inativado_por
-- - data_admissao
-- 
-- DECISÃO: Vamos MANTER essas colunas no Neon por segurança
-- Se houver dados nelas, não queremos perdê-los
-- O código local simplesmente não as utilizará

-- ====================================================================
-- PARTE 6: Criar índices para performance
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_funcionarios_usuario_tipo 
ON funcionarios(usuario_tipo);

CREATE INDEX IF NOT EXISTS idx_funcionarios_contratante_usuario_tipo 
ON funcionarios(contratante_id, usuario_tipo);

-- ====================================================================
-- VERIFICAÇÃO FINAL
-- ====================================================================
DO $$
DECLARE
    v_count_usuario_tipo INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count_usuario_tipo
    FROM information_schema.columns 
    WHERE table_name = 'funcionarios' 
    AND column_name = 'usuario_tipo';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICAÇÃO FINAL:';
    RAISE NOTICE '  - Coluna usuario_tipo existe: %', (v_count_usuario_tipo > 0);
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ====================================================================
-- FIM DO SCRIPT
-- ====================================================================
