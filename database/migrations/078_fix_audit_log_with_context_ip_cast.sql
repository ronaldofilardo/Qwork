-- Migration 078: tornar audit_log_with_context defensiva ao inserir ip_address (casting seguro para inet)

BEGIN;

CREATE OR REPLACE FUNCTION audit_log_with_context(
    p_resource VARCHAR,
    p_action VARCHAR,
    p_resource_id VARCHAR DEFAULT NULL,
    p_details TEXT DEFAULT NULL,
    p_user_cpf CHAR(11) DEFAULT NULL,
    p_clinica_id INTEGER DEFAULT NULL,
    p_contratante_id INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_log_id INTEGER;
    v_ip_text TEXT;
    v_ip_inet INET;
BEGIN
    v_ip_text := NULLIF(current_setting('app.current_user_ip', true), '');
    IF v_ip_text IS NOT NULL THEN
        -- Tentativa de conversão segura para inet
        BEGIN
            v_ip_inet := v_ip_text::inet;
        EXCEPTION WHEN OTHERS THEN
            v_ip_inet := NULL;
        END;
    ELSE
        v_ip_inet := NULL;
    END IF;

    INSERT INTO audit_logs (
        resource,
        action,
        resource_id,
        details,
        user_cpf,
        clinica_id,
        contratante_id,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        p_resource,
        p_action,
        p_resource_id,
        p_details,
        COALESCE(p_user_cpf, NULLIF(current_setting('app.current_user_cpf', true), '')),
        COALESCE(p_clinica_id, NULLIF(current_setting('app.current_user_clinica_id', true), '')::INTEGER),
        COALESCE(p_contratante_id, NULLIF(current_setting('app.current_user_contratante_id', true), '')::INTEGER),
        v_ip_inet,
        NULLIF(current_setting('app.current_user_agent', true), ''),
        NOW()
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION audit_log_with_context IS 'Registra ação no audit_logs incluindo contexto completo (user, clínica, contratante). Faz casting seguro do IP (inet).';

COMMIT;
