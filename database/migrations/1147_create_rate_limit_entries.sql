-- Migration 1147: Garantir tabela de rate limiting distribuído com índice de cleanup
-- Suporta instalações que já possuem a tabela (col expires_at) e instalações novas
-- Data: 08/04/2026

-- ─── Tabela principal ────────────────────────────────────────────────────────
-- Suporta dois layouts de coluna:
--   • instalações existentes: key, count, expires_at
--   • instalações novas    : key, count, expires_at, created_at
CREATE TABLE IF NOT EXISTS rate_limit_entries (
  key        VARCHAR(255) NOT NULL PRIMARY KEY,
  count      INTEGER      NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ  NOT NULL
);

-- Adiciona created_at se não existir (instalações que já tinham a tabela)
ALTER TABLE rate_limit_entries
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Garante que expires_at seja TIMESTAMPTZ (pode ser TIMESTAMP sem TZ em instalações antigas)
-- Faz o cast apenas se o tipo ainda for TIMESTAMP (sem fuso)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'rate_limit_entries'
       AND column_name = 'expires_at'
       AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE rate_limit_entries
      ALTER COLUMN expires_at TYPE TIMESTAMPTZ
      USING expires_at AT TIME ZONE 'UTC';
  END IF;
END;
$$;

-- Índice para queries de cleanup (DELETE WHERE expires_at < NOW())
CREATE INDEX IF NOT EXISTS idx_rate_limit_expires_at
  ON rate_limit_entries (expires_at);

COMMENT ON TABLE rate_limit_entries IS
  'Entradas de rate limiting distribuído. '
  'Chave pode ser IP (rate-limit:ip:<ip>) ou usuário (rate-limit:user:<hash>). '
  'Registros expirados são deletados periodicamente pelo aplicativo.';

