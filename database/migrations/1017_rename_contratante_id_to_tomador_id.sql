-- =====================================================
-- Migration 1017: Renomear contratante_id → tomador_id nas tabelas restantes
-- =====================================================
-- Descrição: Completa a remoção do termo "contratante" do schema.
--            A migration 1016 já tratou lotes_avaliacao e entidades_senhas
--            (contratante_id → entidade_id). Esta migration renomeia as FKs
--            que apontam para tomadores.id nas 5 tabelas restantes.
--
-- Tabelas afetadas:
--   contratos            : contratante_id → tomador_id
--   pagamentos           : contratante_id → tomador_id
--   recibos              : contratante_id → tomador_id
--   funcionarios         : contratante_id → tomador_id
--   tomadores_funcionarios: contratante_id → tomador_id
--
-- Também renomeia:
--   Sequência: seq_contratantes_id → seq_tomadores_id
--   Função:    pode_acessar_contratante() → pode_acessar_tomador()
--   Trigger:   trg_sync_contratante_plano_tipo → trg_sync_tomador_plano_tipo
--   Setting:   app.current_contratante_id → app.current_tomador_id (RLS)
--
-- CRÍTICO: Rodar APÓS migration 1016 em PROD.
-- Data: 2026-03-07
-- =====================================================

BEGIN;

-- =====================================================
-- VALIDAÇÃO PRÉ-MIGRAÇÃO
-- =====================================================

DO $$
DECLARE
    v_missing TEXT[] := '{}';
BEGIN
    -- Verificar que migration 1016 já rodou (contratante_id não existe em lotes_avaliacao)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'lotes_avaliacao'
        AND column_name = 'contratante_id'
    ) THEN
        RAISE EXCEPTION 'ABORTAR: migration 1016 ainda não foi aplicada — lotes_avaliacao ainda tem contratante_id';
    END IF;

    RAISE NOTICE 'Validação OK: migration 1016 já aplicada';
END $$;

-- =====================================================
-- PARTE 1: contratos — contratante_id → tomador_id
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'contratos'
        AND column_name = 'contratante_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'contratos'
            AND column_name = 'tomador_id'
        ) THEN
            ALTER TABLE contratos RENAME COLUMN contratante_id TO tomador_id;
            RAISE NOTICE 'contratos: contratante_id renomeado para tomador_id';
        ELSE
            UPDATE contratos SET tomador_id = contratante_id
            WHERE tomador_id IS NULL AND contratante_id IS NOT NULL;
            ALTER TABLE contratos DROP COLUMN contratante_id;
            RAISE NOTICE 'contratos: dados migrados, contratante_id removida';
        END IF;
    ELSE
        RAISE NOTICE 'contratos: contratante_id já não existe — OK';
    END IF;

    -- Renomear FK constraint
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contratos_contratante_id_fkey') THEN
        ALTER TABLE contratos DROP CONSTRAINT contratos_contratante_id_fkey;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contratos_tomador_id_fkey') THEN
        ALTER TABLE contratos
        ADD CONSTRAINT contratos_tomador_id_fkey
        FOREIGN KEY (tomador_id) REFERENCES tomadores(id) ON DELETE CASCADE;
        RAISE NOTICE 'FK contratos_tomador_id_fkey criada → tomadores(id)';
    END IF;

    -- Renomear índice
    DROP INDEX IF EXISTS idx_contratos_contratante_id;
    CREATE INDEX IF NOT EXISTS idx_contratos_tomador_id ON contratos(tomador_id);
END $$;

-- =====================================================
-- PARTE 2: pagamentos — contratante_id → tomador_id
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'pagamentos'
        AND column_name = 'contratante_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'pagamentos'
            AND column_name = 'tomador_id'
        ) THEN
            ALTER TABLE pagamentos RENAME COLUMN contratante_id TO tomador_id;
            RAISE NOTICE 'pagamentos: contratante_id renomeado para tomador_id';
        ELSE
            UPDATE pagamentos SET tomador_id = contratante_id
            WHERE tomador_id IS NULL AND contratante_id IS NOT NULL;
            ALTER TABLE pagamentos DROP COLUMN contratante_id;
            RAISE NOTICE 'pagamentos: dados migrados, contratante_id removida';
        END IF;
    ELSE
        RAISE NOTICE 'pagamentos: contratante_id já não existe — OK';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pagamentos_contratante_id_fkey') THEN
        ALTER TABLE pagamentos DROP CONSTRAINT pagamentos_contratante_id_fkey;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pagamentos_tomador_id_fkey') THEN
        ALTER TABLE pagamentos
        ADD CONSTRAINT pagamentos_tomador_id_fkey
        FOREIGN KEY (tomador_id) REFERENCES tomadores(id) ON DELETE CASCADE;
        RAISE NOTICE 'FK pagamentos_tomador_id_fkey criada → tomadores(id)';
    END IF;

    DROP INDEX IF EXISTS idx_pagamentos_contratante_id;
    CREATE INDEX IF NOT EXISTS idx_pagamentos_tomador_id ON pagamentos(tomador_id);
END $$;

-- =====================================================
-- PARTE 3: recibos — contratante_id → tomador_id
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'recibos'
        AND column_name = 'contratante_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'recibos'
            AND column_name = 'tomador_id'
        ) THEN
            ALTER TABLE recibos RENAME COLUMN contratante_id TO tomador_id;
            RAISE NOTICE 'recibos: contratante_id renomeado para tomador_id';
        ELSE
            UPDATE recibos SET tomador_id = contratante_id
            WHERE tomador_id IS NULL AND contratante_id IS NOT NULL;
            ALTER TABLE recibos DROP COLUMN contratante_id;
            RAISE NOTICE 'recibos: dados migrados, contratante_id removida';
        END IF;
    ELSE
        RAISE NOTICE 'recibos: contratante_id já não existe — OK';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recibos_contratante_id_fkey') THEN
        ALTER TABLE recibos DROP CONSTRAINT recibos_contratante_id_fkey;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recibos_tomador_id_fkey') THEN
        ALTER TABLE recibos
        ADD CONSTRAINT recibos_tomador_id_fkey
        FOREIGN KEY (tomador_id) REFERENCES tomadores(id) ON DELETE CASCADE;
        RAISE NOTICE 'FK recibos_tomador_id_fkey criada → tomadores(id)';
    END IF;

    DROP INDEX IF EXISTS idx_recibos_contratante_id;
    CREATE INDEX IF NOT EXISTS idx_recibos_tomador_id ON recibos(tomador_id);
END $$;

-- =====================================================
-- PARTE 4: funcionarios — contratante_id → tomador_id
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'funcionarios'
        AND column_name = 'contratante_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'funcionarios'
            AND column_name = 'tomador_id'
        ) THEN
            ALTER TABLE funcionarios RENAME COLUMN contratante_id TO tomador_id;
            RAISE NOTICE 'funcionarios: contratante_id renomeado para tomador_id';
        ELSE
            UPDATE funcionarios SET tomador_id = contratante_id
            WHERE tomador_id IS NULL AND contratante_id IS NOT NULL;
            ALTER TABLE funcionarios DROP COLUMN contratante_id;
            RAISE NOTICE 'funcionarios: dados migrados, contratante_id removida';
        END IF;
    ELSE
        RAISE NOTICE 'funcionarios: contratante_id já não existe — OK';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funcionarios_contratante_id_fkey') THEN
        ALTER TABLE funcionarios DROP CONSTRAINT funcionarios_contratante_id_fkey;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funcionarios_tomador_id_fkey') THEN
        ALTER TABLE funcionarios
        ADD CONSTRAINT funcionarios_tomador_id_fkey
        FOREIGN KEY (tomador_id) REFERENCES tomadores(id) ON DELETE SET NULL;
        RAISE NOTICE 'FK funcionarios_tomador_id_fkey criada → tomadores(id)';
    END IF;

    DROP INDEX IF EXISTS idx_funcionarios_contratante_id;
    DROP INDEX IF EXISTS idx_funcionarios_contratante_usuario;
    CREATE INDEX IF NOT EXISTS idx_funcionarios_tomador_id ON funcionarios(tomador_id);
END $$;

-- =====================================================
-- PARTE 5: tomadores_funcionarios — contratante_id → tomador_id
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tomadores_funcionarios'
        AND column_name = 'contratante_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'tomadores_funcionarios'
            AND column_name = 'tomador_id'
        ) THEN
            ALTER TABLE tomadores_funcionarios RENAME COLUMN contratante_id TO tomador_id;
            RAISE NOTICE 'tomadores_funcionarios: contratante_id renomeado para tomador_id';
        ELSE
            UPDATE tomadores_funcionarios SET tomador_id = contratante_id
            WHERE tomador_id IS NULL AND contratante_id IS NOT NULL;
            ALTER TABLE tomadores_funcionarios DROP COLUMN contratante_id;
            RAISE NOTICE 'tomadores_funcionarios: dados migrados, contratante_id removida';
        END IF;
    ELSE
        RAISE NOTICE 'tomadores_funcionarios: contratante_id já não existe — OK';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tomadores_funcionarios_contratante_id_fkey') THEN
        ALTER TABLE tomadores_funcionarios DROP CONSTRAINT tomadores_funcionarios_contratante_id_fkey;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tomadores_funcionarios_tomador_id_fkey') THEN
        ALTER TABLE tomadores_funcionarios
        ADD CONSTRAINT tomadores_funcionarios_tomador_id_fkey
        FOREIGN KEY (tomador_id) REFERENCES tomadores(id) ON DELETE CASCADE;
        RAISE NOTICE 'FK tomadores_funcionarios_tomador_id_fkey criada → tomadores(id)';
    END IF;

    DROP INDEX IF EXISTS idx_tomadores_funcionarios_contratante_id;
    CREATE INDEX IF NOT EXISTS idx_tomadores_funcionarios_tomador_id ON tomadores_funcionarios(tomador_id);
END $$;

-- =====================================================
-- PARTE 6: Renomear sequência
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'seq_contratantes_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'seq_tomadores_id') THEN
            ALTER SEQUENCE seq_contratantes_id RENAME TO seq_tomadores_id;
            RAISE NOTICE 'Sequência seq_contratantes_id renomeada para seq_tomadores_id';
        ELSE
            RAISE NOTICE 'seq_tomadores_id já existe — mantendo ambas';
        END IF;
    ELSE
        RAISE NOTICE 'seq_contratantes_id não existe — OK';
    END IF;
END $$;

-- =====================================================
-- PARTE 7: Renomear função pode_acessar_contratante
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'pode_acessar_contratante') THEN
        ALTER FUNCTION pode_acessar_contratante RENAME TO pode_acessar_tomador;
        RAISE NOTICE 'Função pode_acessar_contratante renomeada para pode_acessar_tomador';
    ELSE
        RAISE NOTICE 'Função pode_acessar_contratante não existe — OK';
    END IF;
END $$;

-- =====================================================
-- PARTE 8: Renomear trigger
-- =====================================================

DO $$
DECLARE
    v_table_name TEXT;
BEGIN
    -- Encontrar em qual tabela o trigger está
    SELECT event_object_table INTO v_table_name
    FROM information_schema.triggers
    WHERE trigger_name = 'trg_sync_contratante_plano_tipo'
    LIMIT 1;

    IF v_table_name IS NOT NULL THEN
        EXECUTE format(
            'ALTER TRIGGER trg_sync_contratante_plano_tipo ON %I RENAME TO trg_sync_tomador_plano_tipo',
            v_table_name
        );
        RAISE NOTICE 'Trigger trg_sync_contratante_plano_tipo renomeado em tabela %', v_table_name;
    ELSE
        RAISE NOTICE 'Trigger trg_sync_contratante_plano_tipo não encontrado — OK';
    END IF;
END $$;

-- =====================================================
-- PARTE 9: Atualizar RLS policies que usam app.current_contratante_id
-- =====================================================

DO $$
DECLARE
    r RECORD;
    v_definition TEXT;
BEGIN
    FOR r IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE qual::text ILIKE '%current_contratante_id%'
           OR with_check::text ILIKE '%current_contratante_id%'
    LOOP
        RAISE NOTICE 'Policy % em % usa current_contratante_id — revisar manualmente', r.policyname, r.tablename;
    END LOOP;
END $$;

-- =====================================================
-- PARTE 10: Renomear tipo_contratante → tipo_tomador (enum column)
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tomadores_funcionarios'
        AND column_name = 'tipo_contratante'
    ) THEN
        ALTER TABLE tomadores_funcionarios RENAME COLUMN tipo_contratante TO tipo_tomador;
        RAISE NOTICE 'tomadores_funcionarios: tipo_contratante renomeado para tipo_tomador';
    ELSE
        RAISE NOTICE 'tomadores_funcionarios: tipo_contratante já não existe — OK';
    END IF;
END $$;

-- =====================================================
-- VALIDAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    v_remaining INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_remaining
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'contratante_id'
    AND table_name IN ('contratos', 'pagamentos', 'recibos', 'funcionarios', 'tomadores_funcionarios');

    IF v_remaining > 0 THEN
        RAISE EXCEPTION 'FALHA: ainda existem % colunas contratante_id nas tabelas alvo', v_remaining;
    END IF;

    RAISE NOTICE '✅ Migration 1017 concluída com sucesso — contratante_id removido de todas as 5 tabelas';
END $$;

COMMIT;
