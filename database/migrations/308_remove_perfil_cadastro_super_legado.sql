-- =============================================================================
-- Migration 308: Remover perfil 'cadastro' e role 'super' legados
-- Banco alvo : nr-bps_db
-- Data       : 2026-03-06
-- Referência : INCON-3 e INCON-4
-- =============================================================================
-- INCON-3: PerfilUsuario.CADASTRO existe apenas no TypeScript, NÃO no banco.
--          O tipo foi removido do código TS. Esta migration remove referências
--          residuais no banco (policies, constraint, dados legados).
-- INCON-4: role 'super' foi removida pela migration 104, mas reinsere
--          via 001_security_rls_rbac.sql se reexecutada. Garantia definitiva.
-- =============================================================================

BEGIN;

-- =============================================================================
-- PARTE 1 — INCON-3: Sanitizar dados com perfil='cadastro' (segurança de dados)
-- =============================================================================

-- Se existirem funcionários com perfil='cadastro' (não deveriam existir após
-- migrações 200+), converter para 'funcionario' para manter integridade.
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.funcionarios
    WHERE perfil = 'cadastro';

    IF v_count > 0 THEN
        RAISE WARNING '[INCON-3] Encontrados % registros com perfil=cadastro. Convertendo para funcionario.', v_count;
        UPDATE public.funcionarios SET perfil = 'funcionario' WHERE perfil = 'cadastro';
    ELSE
        RAISE NOTICE '[INCON-3] Nenhum registro com perfil=cadastro encontrado. OK.';
    END IF;
END $$;

-- =============================================================================
-- PARTE 2 — INCON-3: Remover/atualizar policy de tomadores que referencia 'cadastro'
-- =============================================================================

-- A policy tomadores_public_insert permitia INSERT quando perfil IS NULL
-- OU perfil = 'cadastro'. Como 'cadastro' foi removido, a policy deve
-- aceitar apenas contexto sem autenticação (NULL) — fluxo de auto-cadastro público.

DROP POLICY IF EXISTS tomadores_public_insert ON public.tomadores;

-- Recriar sem referência a 'cadastro': apenas contexto público (sem sessão autenticada)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'tomadores' AND relkind = 'r') THEN
        EXECUTE $policy$
            CREATE POLICY tomadores_public_insert ON public.tomadores
              FOR INSERT
              WITH CHECK (
                -- Permite INSERT apenas quando NÃO há perfil autenticado na sessão
                -- (fluxo de auto-cadastro público sem login)
                current_user_perfil() IS NULL
              )
        $policy$;
        RAISE NOTICE '[INCON-3] Policy tomadores_public_insert recriada sem referência a cadastro.';
    END IF;
END $$;

-- =============================================================================
-- PARTE 3 — INCON-3: Garantir que funcionarios_perfil_check não inclui 'cadastro'
-- =============================================================================

-- Migrações 200+ já removeram esta constraint. Verificação defensiva.
DO $$
DECLARE
    v_constraint_def TEXT;
BEGIN
    SELECT pg_get_constraintdef(oid) INTO v_constraint_def
    FROM pg_constraint
    WHERE conname = 'funcionarios_perfil_check'
      AND conrelid = 'public.funcionarios'::regclass;

    IF v_constraint_def IS NOT NULL AND v_constraint_def LIKE '%cadastro%' THEN
        RAISE WARNING '[INCON-3] funcionarios_perfil_check ainda inclui cadastro. Corrigindo...';
        ALTER TABLE public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_perfil_check;
        ALTER TABLE public.funcionarios
            ADD CONSTRAINT funcionarios_perfil_check CHECK (
                perfil IN ('funcionario', 'rh', 'admin', 'emissor', 'gestor', 'representante')
            );
        RAISE NOTICE '[INCON-3] funcionarios_perfil_check recriada sem cadastro.';
    ELSE
        RAISE NOTICE '[INCON-3] funcionarios_perfil_check já está correto (sem cadastro). OK.';
    END IF;
END $$;

-- =============================================================================
-- PARTE 4 — INCON-4: Garantir remoção definitiva do role 'super'
-- =============================================================================

-- Migration 104 já executa esta remoção, mas pode ter sido reintroduzida por
-- reexecução de migration 001. Idempotente — não falha se já estiver removido.

DO $$
DECLARE
    v_super_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.roles WHERE name = 'super') INTO v_super_exists;

    IF v_super_exists THEN
        RAISE WARNING '[INCON-4] Role super ainda existe. Removendo permissões e role...';

        -- Remover permissões associadas ao role super
        DELETE FROM public.role_permissions
        WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'super');

        -- Remover o role super
        DELETE FROM public.roles WHERE name = 'super';

        RAISE NOTICE '[INCON-4] Role super removido com sucesso.';
    ELSE
        RAISE NOTICE '[INCON-4] Role super não existe. OK.';
    END IF;
END $$;

-- Garantir que nenhum funcionário ou usuário tem perfil/role = 'super'
DO $$
DECLARE
    v_count_func INTEGER := 0;
    v_count_usr  INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO v_count_func
    FROM public.funcionarios
    WHERE perfil = 'super';

    IF v_count_func > 0 THEN
        RAISE WARNING '[INCON-4] % funcionários com perfil=super encontrados. Convertendo para admin...', v_count_func;
        UPDATE public.funcionarios SET perfil = 'admin' WHERE perfil = 'super';
    END IF;

    -- Verificar tabela usuarios (pós-migration 300)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'tipo_usuario'
    ) THEN
        EXECUTE 'SELECT COUNT(*) FROM public.usuarios WHERE tipo_usuario::TEXT = ''super'''
        INTO v_count_usr;

        IF v_count_usr > 0 THEN
            RAISE WARNING '[INCON-4] % usuários com tipo_usuario=super encontrados. Convertendo para admin...', v_count_usr;
            EXECUTE 'UPDATE public.usuarios SET tipo_usuario = ''admin''::usuario_tipo_enum WHERE tipo_usuario::TEXT = ''super''';
        END IF;
    END IF;

    IF v_count_func = 0 AND v_count_usr = 0 THEN
        RAISE NOTICE '[INCON-4] Nenhum dado com perfil/role=super encontrado. OK.';
    END IF;
END $$;

-- =============================================================================
-- PARTE 5 — Validação final
-- =============================================================================

DO $$
DECLARE
    v_cadastro_count INTEGER;
    v_super_role_count INTEGER;
    v_super_func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_cadastro_count
    FROM public.funcionarios WHERE perfil = 'cadastro';

    SELECT COUNT(*) INTO v_super_role_count
    FROM public.roles WHERE name = 'super';

    SELECT COUNT(*) INTO v_super_func_count
    FROM public.funcionarios WHERE perfil = 'super';

    IF v_cadastro_count > 0 OR v_super_role_count > 0 OR v_super_func_count > 0 THEN
        RAISE EXCEPTION 'FALHA NA VALIDAÇÃO: cadastro_count=%, super_role_count=%, super_func_count=%',
            v_cadastro_count, v_super_role_count, v_super_func_count;
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration 308 concluída com sucesso.';
    RAISE NOTICE '  INCON-3: perfil cadastro removido/sanitizado';
    RAISE NOTICE '  INCON-4: role super removido definitivamente';
    RAISE NOTICE '========================================';
END $$;

COMMIT;
