-- Migration: 070_add_emissao_queue.sql
-- Create table to store emission retries (emissão automática)

CREATE TABLE IF NOT EXISTS emissao_queue (
  id SERIAL PRIMARY KEY,
  lote_id INTEGER NOT NULL REFERENCES lotes_avaliacao(id) ON DELETE CASCADE,
  tentativas INTEGER NOT NULL DEFAULT 0,
  ultimo_erro TEXT,
  proxima_execucao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index to quickly find due records
CREATE INDEX IF NOT EXISTS idx_emissao_queue_proxima_execucao ON emissao_queue (proxima_execucao);
