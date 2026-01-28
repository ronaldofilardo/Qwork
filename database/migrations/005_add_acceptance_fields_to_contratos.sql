-- Migration 005: Adicionar campos de aceite em contratos
-- Data: 2026-01-15
-- Descrição: Adiciona colunas necessárias para registro de aceite do contrato

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'ip_aceite'
  ) THEN
    ALTER TABLE contratos ADD COLUMN ip_aceite VARCHAR(64);
    RAISE NOTICE 'Coluna ip_aceite adicionada';
  ELSE
    RAISE NOTICE 'Coluna ip_aceite já existe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'data_aceite'
  ) THEN
    ALTER TABLE contratos ADD COLUMN data_aceite TIMESTAMP;
    RAISE NOTICE 'Coluna data_aceite adicionada';
  ELSE
    RAISE NOTICE 'Coluna data_aceite já existe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'hash_contrato'
  ) THEN
    ALTER TABLE contratos ADD COLUMN hash_contrato VARCHAR(128);
    RAISE NOTICE 'Coluna hash_contrato adicionada';
  ELSE
    RAISE NOTICE 'Coluna hash_contrato já existe';
  END IF;
END $$;

-- Verificação rápida
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'contratos' AND column_name IN ('ip_aceite','data_aceite','hash_contrato');
