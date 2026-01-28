CREATE FUNCTION gerar_hash_auditoria(p_entidade_tipo VARCHAR, p_entidade_id INTEGER, p_acao VARCHAR, p_dados JSONB, p_timestamp TIMESTAMPTZ) RETURNS VARCHAR AS $$
DECLARE
    v_string_concatenada TEXT;
BEGIN
    v_string_concatenada := CONCAT(
        p_entidade_tipo, '|',
        p_entidade_id, '|',
        p_acao, '|',
        COALESCE(p_dados::TEXT, ''), '|',
        p_timestamp::TEXT
    );
    RETURN encode(digest(v_string_concatenada, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;
