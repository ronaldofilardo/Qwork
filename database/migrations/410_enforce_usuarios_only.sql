-- ====================================================================
-- Migration 410: Enforce Usuarios-Only para Contas do Sistema
-- Data: 2026-04-02
-- Objetivo: Garantir que admin/emissor/gestor/rh NUNCA existam em
--           funcionarios — essas contas pertencem à tabela usuarios.
-- ====================================================================
-- CONTEXTO:
--   Após a separação dos modelos (migration 300+), a tabela funcionarios
--   deve conter APENAS pessoas avaliadas (usuario_tipo IN
--   ('funcionario_clinica','funcionario_entidade')).
--   Esta migration adiciona um CHECK constraint e um trigger de rejeição
--   para enforçar essa regra em nível de banco de dados.
-- ====================================================================

BEGIN;

-- ====================================================================
-- PARTE 1: FUNÇÃO DO TRIGGER
-- ====================================================================

CREATE OR REPLACE FUNCTION public.trg_reject_prohibited_roles_func()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.usuario_tipo IN ('admin', 'emissor', 'gestor', 'rh', 'suporte', 'comercial', 'vendedor') THEN
        RAISE EXCEPTION
            'Contas do sistema (%) não podem ser criadas em funcionarios. '
            'Use a tabela usuarios para admin/emissor/gestor/rh. '
            'Funcionários de campo devem ter usuario_tipo = funcionario_clinica ou funcionario_entidade. '
            '[Migration 410]',
            NEW.usuario_tipo
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.trg_reject_prohibited_roles_func() IS
'Migration 410: Rejeita INSERT/UPDATE de contas sistema (admin/emissor/gestor/rh) em funcionarios. '
'Essas contas pertencem à tabela usuarios.';

-- ====================================================================
-- PARTE 2: TRIGGER
-- ====================================================================

DROP TRIGGER IF EXISTS trg_reject_prohibited_roles ON public.funcionarios;

CREATE TRIGGER trg_reject_prohibited_roles
    BEFORE INSERT OR UPDATE ON public.funcionarios
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_reject_prohibited_roles_func();

COMMENT ON TRIGGER trg_reject_prohibited_roles ON public.funcionarios IS
'Migration 410: BEFORE INSERT/UPDATE — rejeita usuario_tipo de conta sistema em funcionarios.';

-- ====================================================================
-- PARTE 3: CHECK CONSTRAINT (camada adicional de segurança)
-- ====================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'no_account_roles_in_funcionarios'
          AND conrelid = 'funcionarios'::regclass
    ) THEN
        ALTER TABLE public.funcionarios
            ADD CONSTRAINT no_account_roles_in_funcionarios
            CHECK (
                usuario_tipo NOT IN ('admin', 'emissor', 'gestor', 'rh', 'suporte', 'comercial', 'vendedor')
            );
    END IF;
END $$;

COMMENT ON CONSTRAINT no_account_roles_in_funcionarios ON public.funcionarios IS
'Migration 410: Contas do sistema não podem existir em funcionarios. '
'Valores permitidos: funcionario_clinica, funcionario_entidade.';

-- ====================================================================
-- VERIFICAÇÃO
-- ====================================================================

DO $$
DECLARE
    v_trigger_exists BOOLEAN;
    v_constraint_exists BOOLEAN;
    v_function_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_reject_prohibited_roles'
          AND tgrelid = 'funcionarios'::regclass
    ) INTO v_trigger_exists;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'no_account_roles_in_funcionarios'
          AND conrelid = 'funcionarios'::regclass
    ) INTO v_constraint_exists;

    SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'trg_reject_prohibited_roles_func'
    ) INTO v_function_exists;

    IF v_trigger_exists AND v_constraint_exists AND v_function_exists THEN
        RAISE NOTICE 'Migration 410: OK — trigger, constraint e função criados com sucesso.';
    ELSE
        RAISE EXCEPTION 'Migration 410: FALHA — trigger=%, constraint=%, funcao=%',
            v_trigger_exists, v_constraint_exists, v_function_exists;
    END IF;
END $$;

COMMIT;
