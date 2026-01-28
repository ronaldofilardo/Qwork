-- Migration 104: Fix audit trigger function to be robust and insert into audit_logs
-- Data: 2026-01-15
-- Descrição: Substitui a função antiga que insertava na tabela `auditoria` (com falha se current_setting retornava NULL)
-- por uma implementação idempotente, segura e que insere em `audit_logs` (tratamento de exceções quando contexto não estiver presente).

BEGIN;

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usuario_cpf VARCHAR(11);
    v_usuario_perfil VARCHAR(30);
    v_registro_id VARCHAR(100);
BEGIN
    -- Tentar obter contexto da sessão; se não disponível, usar valores de fallback
    BEGIN
        v_usuario_cpf := current_setting('app.current_user_cpf', true);
        v_usuario_perfil := current_setting('app.current_user_perfil', true);
    EXCEPTION WHEN OTHERS THEN
        v_usuario_cpf := 'SYSTEM';
        v_usuario_perfil := 'SYSTEM';
    END;

    -- Determinar registro id (OLD/NEW)
    IF TG_OP = 'DELETE' THEN
        v_registro_id := OLD.id::TEXT;
    ELSE
        v_registro_id := NEW.id::TEXT;
    END IF;

    -- Inserir no audit_logs com campos compatíveis
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (tabela, operacao, registro_id, usuario_cpf, usuario_perfil, dados_novos)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, COALESCE(v_usuario_cpf, 'SYSTEM'), COALESCE(v_usuario_perfil, 'SYSTEM'), row_to_json(NEW)::JSONB);

    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (tabela, operacao, registro_id, usuario_cpf, usuario_perfil, dados_anteriores, dados_novos)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, COALESCE(v_usuario_cpf, 'SYSTEM'), COALESCE(v_usuario_perfil, 'SYSTEM'), row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (tabela, operacao, registro_id, usuario_cpf, usuario_perfil, dados_anteriores)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, COALESCE(v_usuario_cpf, 'SYSTEM'), COALESCE(v_usuario_perfil, 'SYSTEM'), row_to_json(OLD)::JSONB);
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

COMMENT ON FUNCTION public.audit_trigger_function() IS 'Robusta: insere logs em audit_logs com fallback quando contexto da sessão não estiver disponível';

COMMIT;

DO $$ BEGIN RAISE NOTICE 'Migration 104_fix_audit_trigger_function applied: audit trigger function replaced (safe).'; END $$;
