-- Migration: Atualizar função de trigger de auditoria para marcar ações do sistema
-- Data: 2026-01-23
-- Descrição: Quando current_user_cpf não estiver definido, registra '00000000000' como operador do sistema

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    current_user_cpf_val TEXT;
    current_user_perfil_val TEXT;
    record_id TEXT;
BEGIN
    -- Obter valores do contexto da sessão
    current_user_cpf_val := NULLIF(current_setting('app.current_user_cpf', TRUE), '');
    current_user_perfil_val := NULLIF(current_setting('app.current_user_perfil', TRUE), '');

    -- Se não houver CPF no contexto, marcar como sistema
    IF current_user_cpf_val IS NULL THEN
        current_user_cpf_val := '00000000000';
    END IF;

    IF current_user_perfil_val IS NULL THEN
        current_user_perfil_val := 'system';
    END IF;

    -- Determinar o ID do registro baseado na operação
    IF TG_OP = 'DELETE' THEN
        -- Para DELETE, usar o ID da linha OLD
        CASE TG_TABLE_NAME
            WHEN 'funcionarios' THEN record_id := OLD.cpf::TEXT;
            WHEN 'avaliacoes' THEN record_id := OLD.id::TEXT;
            WHEN 'empresas_clientes' THEN record_id := OLD.id::TEXT;
            WHEN 'lotes_avaliacao' THEN record_id := OLD.id::TEXT;
            WHEN 'laudos' THEN record_id := OLD.id::TEXT;
            WHEN 'respostas' THEN record_id := OLD.id::TEXT;
            WHEN 'resultados' THEN record_id := OLD.id::TEXT;
            ELSE record_id := 'unknown';
        END CASE;
    ELSE
        -- Para INSERT/UPDATE, usar o ID da linha NEW
        CASE TG_TABLE_NAME
            WHEN 'funcionarios' THEN record_id := NEW.cpf::TEXT;
            WHEN 'avaliacoes' THEN record_id := NEW.id::TEXT;
            WHEN 'empresas_clientes' THEN record_id := NEW.id::TEXT;
            WHEN 'lotes_avaliacao' THEN record_id := NEW.id::TEXT;
            WHEN 'laudos' THEN record_id := NEW.id::TEXT;
            WHEN 'respostas' THEN record_id := NEW.id::TEXT;
            WHEN 'resultados' THEN record_id := NEW.id::TEXT;
            ELSE record_id := 'unknown';
        END CASE;
    END IF;

    -- Registrar a operação
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, resource_id, new_data)
        VALUES (current_user_cpf_val, current_user_perfil_val, 'INSERT', TG_TABLE_NAME, record_id, row_to_json(NEW));

    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, resource_id, old_data, new_data)
        VALUES (current_user_cpf_val, current_user_perfil_val, 'UPDATE', TG_TABLE_NAME, record_id, row_to_json(OLD), row_to_json(NEW));

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, resource_id, old_data)
        VALUES (current_user_cpf_val, current_user_perfil_val, 'DELETE', TG_TABLE_NAME, record_id, row_to_json(OLD));
    END IF;

    -- Retornar a linha apropriada
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;