-- ==============================================================================
-- VERIFICAÇÃO: Colunas Asaas em Produção
-- ==============================================================================
-- Execute este script APÓS aplicar a migration
-- Deve retornar todas as 9 colunas Asaas + tabela webhook_logs
-- ==============================================================================

-- ==============================================================================
-- 1. VERIFICAR COLUNAS ASAAS NA TABELA PAGAMENTOS
-- ==============================================================================

SELECT 
  '=== COLUNAS ASAAS ===' as info,
  column_name,
  data_type,
  CASE 
    WHEN character_maximum_length IS NOT NULL THEN 'VARCHAR(' || character_maximum_length || ')'
    WHEN numeric_precision IS NOT NULL THEN 'NUMERIC(' || numeric_precision || ',' || numeric_scale || ')'
    WHEN data_type = 'date' THEN 'DATE'
    WHEN data_type = 'text' THEN 'TEXT'
    ELSE data_type
  END as full_type,
  CASE WHEN is_nullable = 'YES' THEN '✅' ELSE '❌' END as nullable
FROM information_schema.columns 
WHERE table_name = 'pagamentos' 
  AND column_name LIKE 'asaas%'
ORDER BY column_name;

-- Resultado esperado: 9 linhas
-- ✅ asaas_boleto_url (TEXT)
-- ✅ asaas_customer_id (VARCHAR(50))
-- ✅ asaas_due_date (DATE)
-- ✅ asaas_invoice_url (TEXT)
-- ✅ asaas_net_value (NUMERIC(10,2))
-- ✅ asaas_payment_id (VARCHAR(50))
-- ✅ asaas_payment_url (TEXT)
-- ✅ asaas_pix_qrcode (TEXT)
-- ✅ asaas_pix_qrcode_image (TEXT)

-- ==============================================================================
-- 2. CONTAR COLUNAS ASAAS
-- ==============================================================================

SELECT 
  '=== CONTAGEM ===' as info,
  COUNT(*) as total_colunas_asaas,
  CASE 
    WHEN COUNT(*) = 9 THEN '✅ OK - Todas as 9 colunas presentes'
    ELSE '❌ ERRO - Esperado 9 colunas, encontrado ' || COUNT(*)
  END as status
FROM information_schema.columns 
WHERE table_name = 'pagamentos' 
  AND column_name LIKE 'asaas%';

-- ==============================================================================
-- 3. VERIFICAR TABELA WEBHOOK_LOGS
-- ==============================================================================

SELECT 
  '=== TABELA WEBHOOK_LOGS ===' as info,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'webhook_logs') as total_columns,
  CASE 
    WHEN table_name = 'webhook_logs' THEN '✅ Tabela existe'
    ELSE '❌ Tabela não encontrada'
  END as status
FROM information_schema.tables 
WHERE table_name = 'webhook_logs';

-- ==============================================================================
-- 4. VERIFICAR COLUNAS DA TABELA WEBHOOK_LOGS
-- ==============================================================================

SELECT 
  '=== ESTRUTURA WEBHOOK_LOGS ===' as info,
  column_name,
  data_type,
  CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'webhook_logs'
ORDER BY ordinal_position;

-- Resultado esperado:
-- ✅ id (SERIAL/INTEGER, NOT NULL)
-- ✅ payment_id (VARCHAR(50), NOT NULL)
-- ✅ event (VARCHAR(100), NOT NULL)
-- ✅ payload (JSONB, NULL)
-- ✅ processed_at (TIMESTAMP, DEFAULT NOW())
-- ✅ ip_address (VARCHAR(45), NULL)
-- ✅ user_agent (TEXT, NULL)
-- ✅ processing_duration_ms (INTEGER, NULL)
-- ✅ error_message (TEXT, NULL)
-- ✅ created_at (TIMESTAMP, DEFAULT NOW())

-- ==============================================================================
-- 5. VERIFICAR ÍNDICES
-- ==============================================================================

SELECT 
  '=== ÍNDICES ===' as info,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE (indexname LIKE '%asaas%' OR indexname LIKE '%webhook%')
  AND tablename IN ('pagamentos', 'webhook_logs')
ORDER BY tablename, indexname;

-- Resultado esperado (pelo menos):
-- ✅ idx_pagamentos_asaas_customer_id
-- ✅ idx_pagamentos_asaas_payment_id
-- ✅ idx_webhook_logs_payment_id
-- ✅ idx_webhook_logs_event
-- ✅ idx_webhook_logs_processed_at
-- ✅ idx_webhook_logs_errors

-- ==============================================================================
-- 6. VERIFICAR CONSTRAINTS
-- ==============================================================================

SELECT 
  '=== CONSTRAINTS ===' as info,
  conname as constraint_name,
  contype as type,
  CASE contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    ELSE contype::text
  END as constraint_type
FROM pg_constraint
WHERE conrelid = 'webhook_logs'::regclass
ORDER BY conname;

-- Resultado esperado:
-- ✅ webhook_logs_pkey (PRIMARY KEY)
-- ✅ uq_webhook_logs_payment_event (UNIQUE)

-- ==============================================================================
-- 7. RESUMO FINAL
-- ==============================================================================

SELECT 
  '=== RESUMO FINAL ===' as info,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'pagamentos' AND column_name LIKE 'asaas%') as colunas_asaas,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_logs') THEN 'SIM' ELSE 'NÃO' END as tabela_webhook_logs,
  (SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE '%asaas%' OR indexname LIKE '%webhook%') as total_indices,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'pagamentos' AND column_name LIKE 'asaas%') = 9
         AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_logs')
    THEN '✅ MIGRATION APLICADA COM SUCESSO'
    ELSE '❌ MIGRATION INCOMPLETA'
  END as status_geral;

-- ==============================================================================
-- 8. TESTE DE INSERT (OPCIONAL)
-- ==============================================================================

-- Este teste NÃO insere dados de verdade, apenas valida a estrutura
-- Se executar sem erro, significa que as colunas existem

EXPLAIN SELECT 
  id,
  asaas_payment_id,
  asaas_customer_id,
  asaas_payment_url,
  asaas_boleto_url,
  asaas_invoice_url,
  asaas_pix_qrcode,
  asaas_pix_qrcode_image,
  asaas_net_value,
  asaas_due_date
FROM pagamentos
WHERE asaas_payment_id = 'pay_test'
LIMIT 1;

-- Se este query executar sem erro, as colunas existem! ✅

-- ==============================================================================
-- FIM DAS VERIFICAÇÕES
-- ==============================================================================
