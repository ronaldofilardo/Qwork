-- Migration 052: Adicionar coluna contrato_id em pagamentos
-- Data: 2025-12-27

ALTER TABLE pagamentos
  ADD COLUMN IF NOT EXISTS contrato_id INTEGER;

-- Adicionar foreign key para contratos (se a tabela contratos existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratos') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'pagamentos_contrato_id_fkey'
    ) THEN
      EXECUTE 'ALTER TABLE pagamentos ADD CONSTRAINT pagamentos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES contratos (id) ON DELETE SET NULL';
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pagamentos_contrato_id ON pagamentos (contrato_id);

COMMENT ON COLUMN pagamentos.contrato_id IS 'Referência opcional ao contrato associado ao pagamento (pode ser NULL para pagamentos independentes)';

DO $$
BEGIN
  RAISE NOTICE 'Migration 052 executada: coluna contrato_id adicionada em pagamentos (se não existia)';
END $$;
