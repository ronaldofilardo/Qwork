-- Migration 011: Habilitar extensão pgcrypto
-- Necessária para funções de hash (digest, gen_salt, etc.) usadas em auditoria e segurança

-- Habilitar extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Comentário
COMMENT ON EXTENSION pgcrypto IS 'Funções criptográficas para PostgreSQL (hash, criptografia, geração de salt)';

-- Log de execução
DO $$
BEGIN
  RAISE NOTICE 'Migration 011 executada: extensão pgcrypto habilitada';
END $$;
