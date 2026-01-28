-- Migration 080: Re-adicionar coluna hash_pdf em laudos
-- Razão: Algumas views e funções dependem de hash_pdf; re-adicionando de forma idempotente

ALTER TABLE laudos
  ADD COLUMN IF NOT EXISTS hash_pdf VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_laudos_hash ON laudos (hash_pdf);

COMMENT ON COLUMN laudos.hash_pdf IS 'Hash SHA-256 do arquivo PDF do laudo para verificação de integridade';

-- Nota: Esta migração é segura de ser executada múltiplas vezes e não remove dados existentes.