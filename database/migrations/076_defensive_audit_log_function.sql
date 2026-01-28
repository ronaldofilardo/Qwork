-- MIGRATION 076: Defensive audit_log_with_context
-- Ensure audit_log_with_context does not fail when audit_logs schema differs

-- Create or replace a defensive version of audit_log_with_context
    CREATE OR REPLACE FUNCTION public.audit_log_with_context(
        p_resource character varying,
        p_action character varying,
        p_resource_id character varying DEFAULT NULL::character varying,
        p_details text DEFAULT NULL::text,
        p_user_cpf character DEFAULT NULL::bpchar,
        p_clinica_id integer DEFAULT NULL::integer,
        p_contratante_id integer DEFAULT NULL::integer
    ) RETURNS integer
    LANGUAGE plpgsql
    AS $$
    DECLARE
        cols TEXT[];
        cols_sql TEXT := '';
        vals_sql TEXT := '';
        sql TEXT;
        v_id INTEGER;
        v_row JSONB;
    BEGIN
        -- Get current columns in audit_logs
        SELECT array_agg(column_name) INTO cols
        FROM information_schema.columns
        WHERE table_name = 'audit_logs';

        IF cols IS NULL OR array_length(cols, 1) = 0 THEN
            RAISE NOTICE 'audit_log_with_context: audit_logs table not found or has no columns';
            RETURN NULL;
        END IF;

        -- Build column/value fragments defensively
        IF 'resource' = ANY(cols) THEN
            cols_sql := cols_sql || ', resource';
            vals_sql := vals_sql || ', ' || coalesce(quote_literal(p_resource), 'NULL');
        END IF;
        IF 'action' = ANY(cols) THEN
            cols_sql := cols_sql || ', action';
            vals_sql := vals_sql || ', ' || coalesce(quote_literal(p_action), 'NULL');
        END IF;
        IF 'resource_id' = ANY(cols) THEN
            cols_sql := cols_sql || ', resource_id';
            vals_sql := vals_sql || ', ' || coalesce(quote_literal(p_resource_id), 'NULL');
        END IF;
        IF 'details' = ANY(cols) THEN
            cols_sql := cols_sql || ', details';
            vals_sql := vals_sql || ', ' || coalesce(quote_literal(p_details), 'NULL');
        END IF;
        IF 'user_cpf' = ANY(cols) THEN
            cols_sql := cols_sql || ', user_cpf';
            vals_sql := vals_sql || ', ' || coalesce(quote_literal(p_user_cpf), 'NULL');
        END IF;
        IF 'clinica_id' = ANY(cols) THEN
            cols_sql := cols_sql || ', clinica_id';
            vals_sql := vals_sql || ', ' || coalesce(quote_literal(CAST(p_clinica_id AS TEXT)), 'NULL');
        END IF;
        IF 'contratante_id' = ANY(cols) THEN
            cols_sql := cols_sql || ', contratante_id';
            vals_sql := vals_sql || ', ' || coalesce(quote_literal(CAST(p_contratante_id AS TEXT)), 'NULL');
        END IF;
        IF 'ip_address' = ANY(cols) THEN
            cols_sql := cols_sql || ', ip_address';
            -- Insert as INET using expression cast to inet (avoid inserting as TEXT literal)
            vals_sql := vals_sql || ', ' || coalesce('NULLIF(current_setting(''app.current_user_ip'', true), '''')::inet', 'NULL');
        END IF;
        IF 'user_agent' = ANY(cols) THEN
            cols_sql := cols_sql || ', user_agent';
            vals_sql := vals_sql || ', ' || coalesce(quote_literal(NULLIF(current_setting('app.current_user_agent', true), '')), 'NULL');
        END IF;
        IF 'created_at' = ANY(cols) THEN
            cols_sql := cols_sql || ', created_at';
            vals_sql := vals_sql || ', NOW()';
        END IF;
        IF 'new_data' = ANY(cols) THEN
            cols_sql := cols_sql || ', new_data';
            vals_sql := vals_sql || ', NULL';
        END IF;
        IF 'old_data' = ANY(cols) THEN
            cols_sql := cols_sql || ', old_data';
            vals_sql := vals_sql || ', NULL';
        END IF;

        -- Finalize and run
        sql := 'INSERT INTO audit_logs (' || ltrim(cols_sql, ', ') || ') VALUES (' || ltrim(vals_sql, ', ') || ') RETURNING id';
        -- Execute dynamic insert
        EXECUTE sql INTO v_id;

        RETURN v_id;
    EXCEPTION WHEN others THEN
        -- As fallback, attempt a minimal insert into known columns if present
        BEGIN
            IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'action') > 0 THEN
                INSERT INTO audit_logs (action, resource, resource_id, user_cpf, created_at)
                VALUES (p_action, p_resource, p_resource_id, p_user_cpf, NOW())
                RETURNING id INTO v_id;
                RETURN v_id;
            END IF;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'audit_log_with_context: fallback failed (%).', SQLERRM;
            RETURN NULL;
        END;
    END;
    $$;

COMMENT ON FUNCTION public.audit_log_with_context(character varying, character varying, character varying, text, character, integer, integer) IS 'Defensive audit logger: inserts only columns that exist in audit_logs (avoids failures on schema drift).';
