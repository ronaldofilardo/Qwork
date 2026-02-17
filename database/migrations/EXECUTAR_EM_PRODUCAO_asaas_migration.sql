-- ==================================================================================
-- MIGRATION CONSOLIDADA: Asaas Payment Gateway - PRODUÇÃO
-- ==================================================================================
-- Data: 2026-02-17
-- Descrição: Script consolidado para adicionar todos os campos Asaas em PRODUÇÃO
-- IMPORTANTE: Execute este script no banco de dados de PRODUÇÃO
-- ==================================================================================

-- ATENÇÃO: FAÇA BACKUP ANTES DE EXECUTAR!

BEGIN;

-- ==============================================================================
-- PARTE 1: Adicionar coluna asaas_payment_id
-- ==============================================================================

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

-- ==============================================================================
-- PARTE 2: Adicionar campos Asaas Payment Gateway
-- ==============================================================================

DO $$
BEGIN
  -- Campo: asaas_customer_id (ID do cliente no Asaas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pagamentos' AND column_name = 'asaas_customer_id'
  ) THEN
    ALTER TABLE pagamentos ADD COLUMN asaas_customer_id VARCHAR(50);
    RAISE NOTICE 'Coluna asaas_customer_id adicionada';
  ELSE
    RAISE NOTICE 'Coluna asaas_customer_id já existe';
  END IF;

  -- Campo: asaas_payment_url (URL de checkout para cartão)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pagamentos' AND column_name = 'asaas_payment_url'
  ) THEN
    ALTER TABLE pagamentos ADD COLUMN asaas_payment_url TEXT;
    RAISE NOTICE 'Coluna asaas_payment_url adicionada';
  ELSE
    RAISE NOTICE 'Coluna asaas_payment_url já existe';
  END IF;

  -- Campo: asaas_boleto_url (URL do boleto)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pagamentos' AND column_name = 'asaas_boleto_url'
  ) THEN
    ALTER TABLE pagamentos ADD COLUMN asaas_boleto_url TEXT;
    RAISE NOTICE 'Coluna asaas_boleto_url adicionada';
  ELSE
    RAISE NOTICE 'Coluna asaas_boleto_url já existe';
  END IF;

  -- Campo: asaas_invoice_url (URL da fatura/invoice)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pagamentos' AND column_name = 'asaas_invoice_url'
  ) THEN
    ALTER TABLE pagamentos ADD COLUMN asaas_invoice_url TEXT;
    RAISE NOTICE 'Coluna asaas_invoice_url adicionada';
  ELSE
    RAISE NOTICE 'Coluna asaas_invoice_url já existe';
  END IF;

  -- Campo: asaas_pix_qrcode (Payload PIX Copia e Cola)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pagamentos' AND column_name = 'asaas_pix_qrcode'
  ) THEN
    ALTER TABLE pagamentos ADD COLUMN asaas_pix_qrcode TEXT;
    RAISE NOTICE 'Coluna asaas_pix_qrcode adicionada';
  ELSE
    RAISE NOTICE 'Coluna asaas_pix_qrcode já existe';
  END IF;

  -- Campo: asaas_pix_qrcode_image (Imagem QR Code em base64)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pagamentos' AND column_name = 'asaas_pix_qrcode_image'
  ) THEN
    ALTER TABLE pagamentos ADD COLUMN asaas_pix_qrcode_image TEXT;
    RAISE NOTICE 'Coluna asaas_pix_qrcode_image adicionada';
  ELSE
    RAISE NOTICE 'Coluna asaas_pix_qrcode_image já existe';
  END IF;

  -- Campo: asaas_net_value (Valor líquido após taxas Asaas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pagamentos' AND column_name = 'asaas_net_value'
  ) THEN
    ALTER TABLE pagamentos ADD COLUMN asaas_net_value NUMERIC(10,2);
    RAISE NOTICE 'Coluna asaas_net_value adicionada';
  ELSE
    RAISE NOTICE 'Coluna asaas_net_value já existe';
  END IF;

  -- Campo: asaas_due_date (Data de vencimento definida no Asaas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pagamentos' AND column_name = 'asaas_due_date'
  ) THEN
    ALTER TABLE pagamentos ADD COLUMN asaas_due_date DATE;
    RAISE NOTICE 'Coluna asaas_due_date adicionada';
  ELSE
    RAISE NOTICE 'Coluna asaas_due_date já existe';
  END IF;
END $$;

-- ==============================================================================
-- PARTE 3: Criar índices
-- ==============================================================================

-- Criar índice em plataforma_id para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_pagamentos_plataforma_id 
  ON pagamentos(plataforma_id);

-- Criar índice em asaas_customer_id
CREATE INDEX IF NOT EXISTS idx_pagamentos_asaas_customer_id 
  ON pagamentos(asaas_customer_id);

-- Criar índice em asaas_payment_id
CREATE INDEX IF NOT EXISTS idx_pagamentos_asaas_payment_id 
  ON pagamentos(asaas_payment_id);

-- ==============================================================================
-- PARTE 4: Criar tabela de logs de webhooks
-- ==============================================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  payment_id VARCHAR(50) NOT NULL,
  event VARCHAR(100) NOT NULL,
  payload JSONB,
  processed_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  processing_duration_ms INTEGER,
  error_message TEXT,
  
  -- Campos de auditoria
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar constraint de unicidade (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_webhook_logs_payment_event'
  ) THEN
    ALTER TABLE webhook_logs 
      ADD CONSTRAINT uq_webhook_logs_payment_event 
      UNIQUE (payment_id, event);
    RAISE NOTICE 'Constraint uq_webhook_logs_payment_event criada';
  ELSE
    RAISE NOTICE 'Constraint uq_webhook_logs_payment_event já existe';
  END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id 
  ON webhook_logs(payment_id);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event 
  ON webhook_logs(event);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed_at 
  ON webhook_logs(processed_at DESC);

-- Índice parcial para webhooks com erro
CREATE INDEX IF NOT EXISTS idx_webhook_logs_errors 
  ON webhook_logs(payment_id, event) 
  WHERE error_message IS NOT NULL;

-- ==============================================================================
-- PARTE 5: Adicionar comentários
-- ==============================================================================

COMMENT ON TABLE webhook_logs IS 'Log de webhooks recebidos do Asaas Payment Gateway';
COMMENT ON COLUMN webhook_logs.payment_id IS 'ID do pagamento no Asaas (pay_xxx)';
COMMENT ON COLUMN webhook_logs.event IS 'Tipo de evento (PAYMENT_RECEIVED, PAYMENT_CONFIRMED, etc)';
COMMENT ON COLUMN webhook_logs.payload IS 'Payload completo do webhook em JSON';
COMMENT ON COLUMN webhook_logs.processing_duration_ms IS 'Tempo de processamento em milissegundos';

COMMENT ON COLUMN pagamentos.asaas_payment_id IS 'ID do pagamento no Asaas (pay_xxx)';
COMMENT ON COLUMN pagamentos.asaas_customer_id IS 'ID do cliente no Asaas (cus_xxx)';
COMMENT ON COLUMN pagamentos.asaas_payment_url IS 'URL de checkout Asaas (para cartão)';
COMMENT ON COLUMN pagamentos.asaas_boleto_url IS 'URL do boleto bancário';
COMMENT ON COLUMN pagamentos.asaas_invoice_url IS 'URL da fatura/invoice';
COMMENT ON COLUMN pagamentos.asaas_pix_qrcode IS 'Código PIX Copia e Cola';
COMMENT ON COLUMN pagamentos.asaas_pix_qrcode_image IS 'Imagem QR Code PIX em base64';
COMMENT ON COLUMN pagamentos.asaas_net_value IS 'Valor líquido após dedução de taxas Asaas';
COMMENT ON COLUMN pagamentos.asaas_due_date IS 'Data de vencimento do pagamento';

-- ==============================================================================
-- VERIFICAÇÃO FINAL
-- ==============================================================================

-- Verificar colunas adicionadas
SELECT 
  '✅ Colunas Asaas adicionadas:' as status,
  column_name, 
  data_type,
  CASE 
    WHEN character_maximum_length IS NOT NULL THEN character_maximum_length::TEXT
    WHEN numeric_precision IS NOT NULL THEN numeric_precision::TEXT || ',' || numeric_scale::TEXT
    ELSE '-'
  END as size
FROM information_schema.columns 
WHERE table_name = 'pagamentos' 
  AND column_name LIKE 'asaas%'
ORDER BY column_name;

-- Verificar tabela webhook_logs
SELECT 
  '✅ Tabela webhook_logs criada' as status,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'webhook_logs') as total_columns
FROM information_schema.tables 
WHERE table_name = 'webhook_logs';

-- Listar índices criados
SELECT 
  '✅ Índices criados' as status,
  indexname
FROM pg_indexes 
WHERE tablename IN ('pagamentos', 'webhook_logs')
  AND (indexname LIKE '%asaas%' OR indexname LIKE '%webhook%')
ORDER BY tablename, indexname;

-- ==============================================================================
-- COMMIT ou ROLLBACK
-- ==============================================================================

-- Se tudo estiver OK, descomente a próxima linha:
COMMIT;

-- Se houver algum erro, descomente a próxima linha:
-- ROLLBACK;

-- ==============================================================================
-- FIM DA MIGRATION
-- ==============================================================================
