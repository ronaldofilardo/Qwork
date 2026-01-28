-- 054_add_pagamentos_detalhes_parcelas.sql
BEGIN;

ALTER TABLE pagamentos
  ADD COLUMN IF NOT EXISTS detalhes_parcelas JSONB;

COMMIT;