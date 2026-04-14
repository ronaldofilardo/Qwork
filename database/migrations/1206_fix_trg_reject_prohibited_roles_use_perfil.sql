-- ====================================================================
-- Migration 1206: Corrigir trg_reject_prohibited_roles_func
-- Data: 2026-04-14
-- Problema: Migration 410 criou a função com NEW.usuario_tipo, mas a
--           tabela funcionarios usa a coluna `perfil` (não usuario_tipo).
--           Erro: "registro 'new' não tem campo 'usuario_tipo'"
--           Code: 42703 — disparado ao atualizar ultima_avaliacao_id
--           via trigger atualizar_ultima_avaliacao_funcionario().
-- Solução: Substituir NEW.usuario_tipo por NEW.perfil na função.
-- ====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.trg_reject_prohibited_roles_func()
RETURNS TRIGGER AS $$
BEGIN
    -- Proibir criação de contas de sistema em funcionarios
    -- (devem ser criadas na tabela usuarios)
    IF NEW.perfil IS NOT NULL AND NEW.perfil = ANY(ARRAY['gestor_entidade']) THEN
        RAISE EXCEPTION
            'Contas do sistema (%) não podem ser criadas em funcionarios. '
            'Gestores de entidade pertencem à tabela usuarios. '
            '[Migration 1206]',
            NEW.perfil
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.trg_reject_prohibited_roles_func() IS
'Migration 1206 (corrige 410): Usa NEW.perfil em vez de NEW.usuario_tipo. '
'A tabela funcionarios tem coluna perfil, não usuario_tipo. '
'Rejeita apenas gestor_entidade que pertence à tabela usuarios.';

-- Verificação
DO $$
DECLARE
    v_funcdef TEXT;
BEGIN
    SELECT pg_get_functiondef(oid)
    INTO v_funcdef
    FROM pg_proc
    WHERE proname = 'trg_reject_prohibited_roles_func';

    IF v_funcdef LIKE '%NEW.perfil%' THEN
        RAISE NOTICE 'Migration 1206: OK — função trg_reject_prohibited_roles_func atualizada para usar NEW.perfil.';
    ELSE
        RAISE EXCEPTION 'Migration 1206: FALHA — função não contém NEW.perfil.';
    END IF;
END $$;

COMMIT;
