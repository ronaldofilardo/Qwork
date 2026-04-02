-- Migration: 1139 — Corrigir constraints NOT NULL e adicionar usuario_tipo em funcionarios
-- Data: 2026-04-01
-- Descrição:
--   1. Adiciona coluna usuario_tipo (usuario_tipo_enum) em funcionarios
--      (migration 1004 tinha bug: referenciava contratante_id que já não existe)
--   2. Corrige colunas que devem ser NOT NULL mas foram criadas nullable por histórico:
--      - clinicas.ativa
--      - entidades.tipo
--      - empresas_clientes.ativa
--      - lotes_avaliacao.tipo
--      - lotes_avaliacao.status
--      - avaliacoes.lote_id
--      - avaliacoes.status
-- Nota: empresa_id, clinica_id e liberado_por em lotes_avaliacao SÃO intencionalmente
--       nullable — lotes do tipo entidade usam entidade_id, não empresa_id/clinica_id.
-- Idempotente: pode ser executado múltiplas vezes.
-- =============================================================================

BEGIN;

-- =============================================================================
-- PARTE 1: Adicionar usuario_tipo em funcionarios
-- =============================================================================

DO $$
BEGIN
    -- Criar ENUM se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usuario_tipo_enum') THEN
        CREATE TYPE usuario_tipo_enum AS ENUM (
            'funcionario_clinica',
            'funcionario_entidade',
            'gestor',
            'rh',
            'admin',
            'emissor',
            'suporte',
            'comercial',
            'vendedor'
        );
        RAISE NOTICE 'ENUM usuario_tipo_enum criado';
    ELSE
        RAISE NOTICE 'ENUM usuario_tipo_enum já existe';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'funcionarios'
          AND column_name = 'usuario_tipo'
    ) THEN
        -- Desabilitar triggers de auditoria para permitir UPDATE sem contexto de sessão
        ALTER TABLE funcionarios DISABLE TRIGGER ALL;

        -- Adicionar com DEFAULT temporário para rows existentes
        ALTER TABLE funcionarios
            ADD COLUMN usuario_tipo usuario_tipo_enum NOT NULL DEFAULT 'funcionario_entidade';

        -- Tentar inferir usuario_tipo de perfil (para rows existentes)
        UPDATE funcionarios SET usuario_tipo =
            CASE
                WHEN perfil = 'admin'    THEN 'admin'::usuario_tipo_enum
                WHEN perfil = 'emissor'  THEN 'emissor'::usuario_tipo_enum
                WHEN perfil = 'gestor'   THEN 'gestor'::usuario_tipo_enum
                WHEN perfil = 'rh'       THEN 'rh'::usuario_tipo_enum
                WHEN perfil = 'suporte'  THEN 'suporte'::usuario_tipo_enum
                WHEN perfil = 'comercial' THEN 'comercial'::usuario_tipo_enum
                WHEN perfil = 'vendedor' THEN 'vendedor'::usuario_tipo_enum
                ELSE 'funcionario_entidade'::usuario_tipo_enum
            END;

        -- Remover DEFAULT temporário (INSERTs futuros devem declarar explicitamente)
        ALTER TABLE funcionarios
            ALTER COLUMN usuario_tipo DROP DEFAULT;

        -- Reabilitar triggers de auditoria
        ALTER TABLE funcionarios ENABLE TRIGGER ALL;

        RAISE NOTICE 'Coluna usuario_tipo adicionada em funcionarios e populada de perfil';
    ELSE
        RAISE NOTICE 'Coluna usuario_tipo já existe em funcionarios';
    END IF;
END $$;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_funcionarios_usuario_tipo
    ON funcionarios(usuario_tipo);

-- =============================================================================
-- PARTE 2: clinicas.ativa — NOT NULL DEFAULT true
-- =============================================================================

DO $$
BEGIN
    -- Garantir que não há NULLs antes de adicionar NOT NULL
    UPDATE clinicas SET ativa = true WHERE ativa IS NULL;

    -- Adicionar DEFAULT se não existir
    ALTER TABLE clinicas ALTER COLUMN ativa SET DEFAULT true;

    -- Adicionar NOT NULL se ainda nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'clinicas'
          AND column_name = 'ativa' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE clinicas ALTER COLUMN ativa SET NOT NULL;
        RAISE NOTICE 'clinicas.ativa: SET NOT NULL aplicado';
    ELSE
        RAISE NOTICE 'clinicas.ativa: já é NOT NULL';
    END IF;
END $$;

-- =============================================================================
-- PARTE 3: entidades.tipo — NOT NULL DEFAULT 'entidade'
-- =============================================================================

DO $$
BEGIN
    UPDATE entidades SET tipo = 'entidade' WHERE tipo IS NULL;

    ALTER TABLE entidades ALTER COLUMN tipo SET DEFAULT 'entidade';

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'entidades'
          AND column_name = 'tipo' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE entidades ALTER COLUMN tipo SET NOT NULL;
        RAISE NOTICE 'entidades.tipo: SET NOT NULL aplicado';
    ELSE
        RAISE NOTICE 'entidades.tipo: já é NOT NULL';
    END IF;
END $$;

-- =============================================================================
-- PARTE 4: empresas_clientes.ativa — NOT NULL DEFAULT true
-- =============================================================================

DO $$
BEGIN
    UPDATE empresas_clientes SET ativa = true WHERE ativa IS NULL;

    ALTER TABLE empresas_clientes ALTER COLUMN ativa SET DEFAULT true;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'empresas_clientes'
          AND column_name = 'ativa' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE empresas_clientes ALTER COLUMN ativa SET NOT NULL;
        RAISE NOTICE 'empresas_clientes.ativa: SET NOT NULL aplicado';
    ELSE
        RAISE NOTICE 'empresas_clientes.ativa: já é NOT NULL';
    END IF;
END $$;

-- =============================================================================
-- PARTE 5: lotes_avaliacao.tipo — NOT NULL DEFAULT 'completo'
-- =============================================================================

DO $$
BEGIN
    UPDATE lotes_avaliacao SET tipo = 'completo' WHERE tipo IS NULL;

    ALTER TABLE lotes_avaliacao ALTER COLUMN tipo SET DEFAULT 'completo';

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lotes_avaliacao'
          AND column_name = 'tipo' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE lotes_avaliacao ALTER COLUMN tipo SET NOT NULL;
        RAISE NOTICE 'lotes_avaliacao.tipo: SET NOT NULL aplicado';
    ELSE
        RAISE NOTICE 'lotes_avaliacao.tipo: já é NOT NULL';
    END IF;
END $$;

-- =============================================================================
-- PARTE 6: lotes_avaliacao.status — NOT NULL DEFAULT 'ativo'
-- =============================================================================

DO $$
BEGIN
    UPDATE lotes_avaliacao SET status = 'ativo' WHERE status IS NULL;

    ALTER TABLE lotes_avaliacao ALTER COLUMN status SET DEFAULT 'ativo';

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lotes_avaliacao'
          AND column_name = 'status' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE lotes_avaliacao ALTER COLUMN status SET NOT NULL;
        RAISE NOTICE 'lotes_avaliacao.status: SET NOT NULL aplicado';
    ELSE
        RAISE NOTICE 'lotes_avaliacao.status: já é NOT NULL';
    END IF;
END $$;

-- =============================================================================
-- PARTE 7: avaliacoes.lote_id — NOT NULL (FK obrigatória)
-- =============================================================================

DO $$
DECLARE
    v_nulls INTEGER;
BEGIN
    -- Verificar se há algum NULL (orphan avaliacoes)
    SELECT COUNT(*) INTO v_nulls FROM avaliacoes WHERE lote_id IS NULL;

    IF v_nulls > 0 THEN
        RAISE WARNING 'avaliacoes.lote_id: % linhas com NULL — serão deletadas (orphan records)', v_nulls;
        DELETE FROM avaliacoes WHERE lote_id IS NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'avaliacoes'
          AND column_name = 'lote_id' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE avaliacoes ALTER COLUMN lote_id SET NOT NULL;
        RAISE NOTICE 'avaliacoes.lote_id: SET NOT NULL aplicado';
    ELSE
        RAISE NOTICE 'avaliacoes.lote_id: já é NOT NULL';
    END IF;
END $$;

-- =============================================================================
-- PARTE 8: avaliacoes.status — NOT NULL DEFAULT 'iniciada'
-- =============================================================================

DO $$
BEGIN
    UPDATE avaliacoes SET status = 'iniciada' WHERE status IS NULL;

    ALTER TABLE avaliacoes ALTER COLUMN status SET DEFAULT 'iniciada';

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'avaliacoes'
          AND column_name = 'status' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE avaliacoes ALTER COLUMN status SET NOT NULL;
        RAISE NOTICE 'avaliacoes.status: SET NOT NULL aplicado';
    ELSE
        RAISE NOTICE 'avaliacoes.status: já é NOT NULL';
    END IF;
END $$;

COMMIT;
