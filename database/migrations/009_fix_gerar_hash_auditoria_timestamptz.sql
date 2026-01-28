-- Migration 009: Fix gerar_hash_auditoria - add overload for TIMESTAMPTZ
-- A função original aceita TIMESTAMP, mas triggers passam CURRENT_TIMESTAMP (TIMESTAMPTZ)

-- Criar sobrecarga da função para aceitar TIMESTAMPTZ
CREATE OR REPLACE FUNCTION gerar_hash_auditoria(
  p_entidade_tipo VARCHAR,
  p_entidade_id INTEGER,
  p_acao VARCHAR,
  p_dados JSONB,
  p_timestamp TIMESTAMPTZ  -- TIMESTAMPTZ em vez de TIMESTAMP
) RETURNS VARCHAR AS $$
DECLARE
  v_concatenado TEXT;
BEGIN
  -- Concatenar dados para gerar hash
  v_concatenado := p_entidade_tipo || '|' || 
                   COALESCE(p_entidade_id::TEXT, 'NULL') || '|' || 
                   p_acao || '|' || 
                   COALESCE(p_dados::TEXT, '{}') || '|' || 
                   p_timestamp::TEXT;
  
  -- Retornar hash SHA-256
  RETURN encode(digest(v_concatenado, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION gerar_hash_auditoria(VARCHAR, INTEGER, VARCHAR, JSONB, TIMESTAMPTZ) 
IS 'Sobrecarga para aceitar TIMESTAMPTZ - gera hash SHA-256 para verificar integridade de registros de auditoria';

-- Log de execução
DO $$
BEGIN
  RAISE NOTICE 'Migration 009 executada: sobrecarga de gerar_hash_auditoria criada para TIMESTAMPTZ';
END $$;
