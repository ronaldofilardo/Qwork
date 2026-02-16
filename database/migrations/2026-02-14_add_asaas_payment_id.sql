-- Migration: Adicionar coluna asaas_payment_id
-- Data: 2026-02-14
-- Descrição: Adiciona campo asaas_payment_id que estava faltando na tabela pagamentos

DO $$
BEGIN
  -- Campo: asaas_payment_id (ID da cobrança/pagamento no Asaas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pagamentos' AND column_name = 'asaas_payment_id'
  ) THEN
    ALTER TABLE pagamentos ADD COLUMN asaas_payment_id VARCHAR(50);
    RAISE NOTICE 'Coluna asaas_payment_id adicionada';
  ELSE
    RAISE NOTICE 'Coluna asaas_payment_id já existe';
  END IF;
END $$;
