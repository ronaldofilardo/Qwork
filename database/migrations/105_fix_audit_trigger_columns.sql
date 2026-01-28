-- Migration 105: Fix audit_trigger_function column mapping to match `audit_logs` schema
-- Data: 2026-01-15
-- Descrição: Atualiza a função `audit_trigger_function` para inserir nas colunas corretas da tabela `audit_logs` (resource, action, resource_id, user_cpf, user_perfil, old_data, new_data)

BEGIN;

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usuario_cpf VARCHAR(11);
    v_usuario_perfil VARCHAR(30);
    v_registro_id TEXT;
BEGIN
    -- Tentar obter contexto da sessão; se não disponível, usar valores de fallback
    BEGIN
      v_usuario_cpf := current_setting('app.current_user_cpf', true);
      v_usuario_perfil := current_setting('app.current_user_perfil', true);
    EXCEPTION WHEN OTHERS THEN
      v_usuario_cpf := NULL; -- allow NULLs; audit_logs.user_cpf can be null in some cases
      v_usuario_perfil := NULL;
    END;

    -- Determinar registro id (OLD/NEW)
    IF TG_OP = 'DELETE' THEN
        v_registro_id := OLD.id::TEXT;
    ELSE
        v_registro_id := NEW.id::TEXT;
    END IF;

    -- Inserir no audit_logs com campos compatíveis
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (resource, action, resource_id, user_cpf, user_perfil, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, v_usuario_cpf, v_usuario_perfil, row_to_json(NEW)::JSONB);

    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (resource, action, resource_id, user_cpf, user_perfil, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, v_usuario_cpf, v_usuario_perfil, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (resource, action, resource_id, user_cpf, user_perfil, old_data)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, v_usuario_cpf, v_usuario_perfil, row_to_json(OLD)::JSONB);
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

COMMENT ON FUNCTION public.audit_trigger_function() IS 'Robusta: insere logs em audit_logs com mapeamento correto de colunas e fallback quando contexto da sessão não estiver disponível.';

COMMIT;

DO $$ BEGIN RAISE NOTICE 'Migration 105_fix_audit_trigger_columns applied: audit trigger function column mapping corrected.'; END $$;
