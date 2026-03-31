-- =====================================================
-- Migration 1016: Sincronizar PROD com modelo dois fluxos distintos
-- =====================================================
-- Descrição: Completa migração contratante_id → entidade_id em PROD.
--            Garante que entidade e clínica são fluxos 100% separados.
--
-- Fluxo Entidade: entidade_id → entidades.id (gestor)
-- Fluxo Clínica:  clinica_id  → clinicas.id  (rh)
--
-- CRÍTICO: Rodar em PROD ANTES do próximo deploy.
--          O login.ts já usa entidade_id que não existe em PROD hoje.
--
-- Data: 2026-03-06
-- =====================================================

BEGIN;

-- =====================================================
-- VALIDAÇÃO PRÉ-MIGRAÇÃO
-- =====================================================

-- Garantir que nenhum lote com contratante_id aponta para tomadores.tipo = 'clinica'
-- (se retornar > 0, a migração é abortada — dados precisam ser corrigidos manualmente)
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Verificar se a coluna contratante_id existe antes de consultar
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'lotes_avaliacao'
        AND column_name = 'contratante_id'
    ) THEN
        SELECT COUNT(*) INTO v_count
        FROM lotes_avaliacao la
        JOIN tomadores t ON t.id = la.contratante_id
        WHERE t.tipo = 'clinica';

        IF v_count > 0 THEN
            RAISE EXCEPTION 'ABORTAR: % lotes com contratante_id apontam para tomadores.tipo=clinica. Corrigir manualmente antes de migrar.', v_count;
        END IF;

        RAISE NOTICE 'Validação OK: nenhum lote com contratante_id aponta para tipo=clinica';
    ELSE
        RAISE NOTICE 'Coluna contratante_id não existe em lotes_avaliacao — já migrado (migration 1008)';
    END IF;
END $$;

-- =====================================================
-- PARTE 1: entidades_senhas — contratante_id → entidade_id
-- =====================================================

DO $$
BEGIN
    -- Verificar se a coluna contratante_id ainda existe (PROD pode tê-la)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'entidades_senhas'
        AND column_name = 'contratante_id'
    ) THEN
        -- Verificar se entidade_id já existe (DEV pode ter ambas)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'entidades_senhas'
            AND column_name = 'entidade_id'
        ) THEN
            -- Renomear contratante_id → entidade_id
            ALTER TABLE entidades_senhas RENAME COLUMN contratante_id TO entidade_id;
            RAISE NOTICE 'entidades_senhas: contratante_id renomeado para entidade_id';
        ELSE
            -- Ambas existem: copiar dados faltantes e dropar contratante_id
            UPDATE entidades_senhas
            SET entidade_id = contratante_id
            WHERE entidade_id IS NULL AND contratante_id IS NOT NULL;

            ALTER TABLE entidades_senhas DROP COLUMN contratante_id;
            RAISE NOTICE 'entidades_senhas: dados migrados de contratante_id para entidade_id, coluna removida';
        END IF;
    ELSE
        RAISE NOTICE 'entidades_senhas: contratante_id já não existe — OK';
    END IF;

    -- Verificar se a FK aponta para tomadores.id e trocar para entidades.id
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'entidades_senhas_contratante_id_fkey'
    ) THEN
        ALTER TABLE entidades_senhas DROP CONSTRAINT entidades_senhas_contratante_id_fkey;
        RAISE NOTICE 'FK entidades_senhas_contratante_id_fkey removida';
    END IF;

    -- Criar FK para entidades.id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'entidades_senhas_entidade_id_fkey'
    ) THEN
        ALTER TABLE entidades_senhas
        ADD CONSTRAINT entidades_senhas_entidade_id_fkey
        FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;
        RAISE NOTICE 'FK entidades_senhas_entidade_id_fkey criada → entidades(id)';
    END IF;

    -- Atualizar índice único
    DROP INDEX IF EXISTS entidades_senhas_contratante_cpf_unique;
    CREATE UNIQUE INDEX IF NOT EXISTS entidades_senhas_entidade_cpf_unique
    ON entidades_senhas(entidade_id, cpf);
    RAISE NOTICE 'Índice único entidades_senhas_entidade_cpf_unique criado';
END $$;

-- =====================================================
-- PARTE 2: lotes_avaliacao — contratante_id → entidade_id
-- (migration 1008 pode já ter feito parcialmente)
-- =====================================================

DO $$
BEGIN
    -- Verificar se contratante_id ainda existe em lotes_avaliacao
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'lotes_avaliacao'
        AND column_name = 'contratante_id'
    ) THEN
        -- Se entidade_id já existe (DEV/migration 1008), migrar dados e dropar
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'lotes_avaliacao'
            AND column_name = 'entidade_id'
        ) THEN
            -- Copiar dados faltantes
            UPDATE lotes_avaliacao
            SET entidade_id = contratante_id
            WHERE entidade_id IS NULL AND contratante_id IS NOT NULL
            AND clinica_id IS NULL;

            -- Dropar FK e constraint antigas
            IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lotes_avaliacao_contratante_id_fkey') THEN
                ALTER TABLE lotes_avaliacao DROP CONSTRAINT lotes_avaliacao_contratante_id_fkey;
            END IF;

            IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lotes_avaliacao_clinica_or_contratante_check') THEN
                ALTER TABLE lotes_avaliacao DROP CONSTRAINT lotes_avaliacao_clinica_or_contratante_check;
            END IF;

            -- Dropar trigger de sincronização (migration 1008)
            DROP TRIGGER IF EXISTS trg_sync_entidade_contratante ON lotes_avaliacao;
            DROP FUNCTION IF EXISTS sync_entidade_contratante_id();

            -- Dropar índice antigo
            DROP INDEX IF EXISTS idx_lotes_avaliacao_contratante_id;

            -- Dropar coluna contratante_id
            ALTER TABLE lotes_avaliacao DROP COLUMN contratante_id;
            RAISE NOTICE 'lotes_avaliacao: contratante_id removida (entidade_id já existe)';
        ELSE
            -- Renomear direto
            ALTER TABLE lotes_avaliacao RENAME COLUMN contratante_id TO entidade_id;
            RAISE NOTICE 'lotes_avaliacao: contratante_id renomeada para entidade_id';

            -- Trocar FK
            IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lotes_avaliacao_contratante_id_fkey') THEN
                ALTER TABLE lotes_avaliacao DROP CONSTRAINT lotes_avaliacao_contratante_id_fkey;
            END IF;
        END IF;
    ELSE
        RAISE NOTICE 'lotes_avaliacao: contratante_id já não existe — OK';
    END IF;

    -- Garantir FK para entidades.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'lotes_avaliacao_entidade_id_fkey'
    ) THEN
        ALTER TABLE lotes_avaliacao
        ADD CONSTRAINT lotes_avaliacao_entidade_id_fkey
        FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;
        RAISE NOTICE 'FK lotes_avaliacao_entidade_id_fkey criada → entidades(id)';
    END IF;

    -- Garantir constraint de segregação (dois fluxos XOR)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'lotes_avaliacao_owner_segregation_check'
    ) THEN
        -- Remover constraint antiga se existir
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lotes_avaliacao_clinica_or_contratante_check') THEN
            ALTER TABLE lotes_avaliacao DROP CONSTRAINT lotes_avaliacao_clinica_or_contratante_check;
        END IF;

        ALTER TABLE lotes_avaliacao
        ADD CONSTRAINT lotes_avaliacao_owner_segregation_check
        CHECK (
            (clinica_id IS NOT NULL AND empresa_id IS NOT NULL AND entidade_id IS NULL)
            OR
            (entidade_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL)
        );
        RAISE NOTICE 'Constraint lotes_avaliacao_owner_segregation_check criada';
    END IF;

    -- Garantir índice
    CREATE INDEX IF NOT EXISTS idx_lotes_entidade_id
    ON lotes_avaliacao(entidade_id) WHERE entidade_id IS NOT NULL;
END $$;

-- =====================================================
-- PARTE 3: RLS policies para lotes_avaliacao — dois fluxos
-- =====================================================

-- Remover policy antiga que usa contratante_id
DROP POLICY IF EXISTS lotes_entidade_select ON lotes_avaliacao;
DROP POLICY IF EXISTS lotes_entidade_update ON lotes_avaliacao;

-- Criar policy de gestor usando entidade_id (FLUXO ENTIDADE)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'lotes_avaliacao'
        AND policyname = 'lotes_gestor_entidade_select'
    ) THEN
        CREATE POLICY lotes_gestor_entidade_select ON lotes_avaliacao
        FOR SELECT
        USING (
            current_setting('app.current_user_perfil', true) = 'gestor'
            AND entidade_id IS NOT NULL
            AND entidade_id = NULLIF(current_setting('app.current_user_entidade_id', true), '')::INTEGER
        );
        RAISE NOTICE 'Policy lotes_gestor_entidade_select criada';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'lotes_avaliacao'
        AND policyname = 'lotes_gestor_entidade_update'
    ) THEN
        CREATE POLICY lotes_gestor_entidade_update ON lotes_avaliacao
        FOR UPDATE
        USING (
            current_setting('app.current_user_perfil', true) = 'gestor'
            AND entidade_id IS NOT NULL
            AND entidade_id = NULLIF(current_setting('app.current_user_entidade_id', true), '')::INTEGER
        );
        RAISE NOTICE 'Policy lotes_gestor_entidade_update criada';
    END IF;
END $$;

-- =====================================================
-- PARTE 4: Deprecar current_user_contratante_id()
-- =====================================================

CREATE OR REPLACE FUNCTION current_user_contratante_id()
RETURNS INTEGER AS $$
BEGIN
    -- DEPRECATED: Use current_user_entidade_id() para fluxo entidade
    -- ou clinica_id direto na sessão para fluxo clínica.
    -- Esta função será removida em release futura.
    RAISE WARNING '[DEPRECATED] current_user_contratante_id() chamada — use current_user_entidade_id()';
    RETURN NULLIF(current_setting('app.current_user_contratante_id', true), '')::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- PARTE 5: Corrigir trigger fn_audit_entidades_senhas (PROD)
-- Se referencia contratante_id, atualizar para entidade_id
-- =====================================================

DO $$
DECLARE
    v_func_body TEXT;
BEGIN
    SELECT prosrc INTO v_func_body
    FROM pg_proc
    WHERE proname = 'fn_audit_entidades_senhas';

    IF v_func_body IS NOT NULL AND v_func_body ILIKE '%contratante_id%' THEN
        RAISE NOTICE 'fn_audit_entidades_senhas ainda referencia contratante_id — revisar manualmente se necessário';
    ELSE
        RAISE NOTICE 'fn_audit_entidades_senhas OK ou não existe';
    END IF;
END $$;

-- =====================================================
-- VALIDAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    v_has_contratante_lotes BOOLEAN;
    v_has_contratante_senhas BOOLEAN;
    v_has_entidade_lotes BOOLEAN;
    v_has_entidade_senhas BOOLEAN;
    v_policy_count INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'lotes_avaliacao' AND column_name = 'contratante_id'
    ) INTO v_has_contratante_lotes;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'entidades_senhas' AND column_name = 'contratante_id'
    ) INTO v_has_contratante_senhas;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'lotes_avaliacao' AND column_name = 'entidade_id'
    ) INTO v_has_entidade_lotes;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'entidades_senhas' AND column_name = 'entidade_id'
    ) INTO v_has_entidade_senhas;

    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE tablename = 'lotes_avaliacao'
    AND policyname LIKE 'lotes_gestor_entidade_%';

    RAISE NOTICE '=== VALIDAÇÃO MIGRATION 1016 ===';
    RAISE NOTICE 'lotes_avaliacao.contratante_id existe: %   (esperado: false)', v_has_contratante_lotes;
    RAISE NOTICE 'entidades_senhas.contratante_id existe: %  (esperado: false)', v_has_contratante_senhas;
    RAISE NOTICE 'lotes_avaliacao.entidade_id existe: %      (esperado: true)', v_has_entidade_lotes;
    RAISE NOTICE 'entidades_senhas.entidade_id existe: %     (esperado: true)', v_has_entidade_senhas;
    RAISE NOTICE 'Policies gestor entidade em lotes: %       (esperado: 2)', v_policy_count;

    IF v_has_contratante_lotes OR v_has_contratante_senhas THEN
        RAISE WARNING 'ATENÇÃO: Colunas contratante_id ainda existem — verificar logs acima';
    END IF;

    IF NOT v_has_entidade_lotes OR NOT v_has_entidade_senhas THEN
        RAISE EXCEPTION 'FALHA: Colunas entidade_id não presentes — migration incompleta';
    END IF;
END $$;

COMMIT;
