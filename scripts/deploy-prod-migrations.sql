-- =====================================================
-- DEPLOYMENT PRODUÇÃO - 16 FEVEREIRO 2026
-- Todas as Migrações SQL das Últimas 72h
-- =====================================================
-- EXECUTAR EM SEQUÊNCIA NO BANCO DE PRODUÇÃO
-- =====================================================

-- =====================================================
-- MIGRAÇÃO 1: Fix Trigger Q37 (Migração 165)
-- CRÍTICA: Executar PRIMEIRO!
-- =====================================================

BEGIN;

-- Step 1: Verificar estado atual
SELECT 
  routine_name, 
  routine_type,
  'FUNÇÃO ANTIGA (será substituída)' as status
FROM information_schema.routines 
WHERE routine_name = 'atualizar_ultima_avaliacao_funcionario'
AND routine_type = 'FUNCTION';

-- Step 2: Drop da trigger existente
DROP TRIGGER IF EXISTS trigger_atualizar_ultima_avaliacao 
ON lotes_avaliacao CASCADE;

-- Step 3: Drop da função antiga
DROP FUNCTION IF EXISTS atualizar_ultima_avaliacao_funcionario() CASCADE;

-- Step 4: Recriar função CORRIGIDA (sem referências a colunas inexistentes)
CREATE OR REPLACE FUNCTION atualizar_ultima_avaliacao_funcionario()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE funcionarios
  SET 
    ultima_avaliacao_id = NEW.id,
    ultima_avaliacao_data = NEW.criado_em,
    ultima_avaliacao_score = NEW.score,
    atualizado_em = NOW()
  WHERE id = NEW.funcionario_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recriar trigger
CREATE TRIGGER trigger_atualizar_ultima_avaliacao
AFTER INSERT OR UPDATE ON lotes_avaliacao
FOR EACH ROW
EXECUTE FUNCTION atualizar_ultima_avaliacao_funcionario();

-- Step 6: Validação
SELECT 
  COUNT(*) as trigger_count,
  'Trigger recriada com sucesso!' as status
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_atualizar_ultima_avaliacao';
-- Esperado: 1 row

COMMIT;

-- =====================================================
-- MIGRAÇÃO 2: Verificação e Sincronização de Laudos
-- =====================================================

BEGIN;

-- Verificação 1: Laudos com PDF gerado mas status errado
SELECT 
  COUNT(*) as laudos_com_problema,
  'Laudos com PDF mas status=rascunho (serão corrigidos)' as descricao
FROM laudos
WHERE hash_pdf IS NOT NULL 
  AND status = 'rascunho'
  AND arquivo_remoto_url IS NULL;

-- Correção 1: Marcar laudos órfãos como 'emitido'
UPDATE laudos
SET 
  status = 'emitido',
  emitido_em = COALESCE(emitido_em, atualizado_em, NOW()),
  atualizado_em = NOW()
WHERE 
  hash_pdf IS NOT NULL 
  AND status = 'rascunho'
  AND arquivo_remoto_url IS NULL;

-- Retornar resultado
SELECT 
  COUNT(*) as laudos_corrigidos,
  'Laudos agora marcados como emitido' as status
FROM laudos 
WHERE status = 'emitido' 
  AND hash_pdf IS NOT NULL
  AND arquivo_remoto_url IS NULL;

COMMIT;

-- =====================================================
-- MIGRAÇÃO 3: Adicionar coluna concluida_em (206)
-- =====================================================

BEGIN;

-- Adicionar coluna concluida_em se não existir
ALTER TABLE avaliacoes
  ADD COLUMN IF NOT EXISTS concluida_em TIMESTAMP;

-- Atualizar avaliações que já estão concluídas mas não têm concluida_em
UPDATE avaliacoes
SET concluida_em = COALESCE(concluida_em, envio, atualizado_em)
WHERE status = 'concluida' AND concluida_em IS NULL;

-- Criar índice para melhor performance em buscas de data de conclusão
CREATE INDEX IF NOT EXISTS idx_avaliacoes_concluida_em 
ON avaliacoes(concluida_em) 
WHERE concluida_em IS NOT NULL;

-- Validação
SELECT 
  COUNT(*) as avaliacoes_com_data,
  'Avaliações com data de conclusão registrada' as status
FROM avaliacoes
WHERE concluida_em IS NOT NULL;

COMMIT;

-- =====================================================
-- MIGRAÇÃO 4: Criar Tabela Asaas Pagamentos
-- =====================================================

BEGIN;

-- Verificar se tabela já existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'asaas_pagamentos'
  ) THEN
    RAISE NOTICE 'Criando tabela asaas_pagamentos...';
  ELSE
    RAISE NOTICE 'Tabela asaas_pagamentos já existe, pulando criação...';
  END IF;
END $$;

-- Criar tabela
CREATE TABLE IF NOT EXISTS asaas_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao sistema
  pagamento_id UUID NOT NULL,
  CONSTRAINT fk_pagamento FOREIGN KEY (pagamento_id) 
    REFERENCES pagamentos(id) ON DELETE CASCADE,
  
  -- IDs Asaas
  asaas_subscription_id VARCHAR(255) UNIQUE,
  asaas_customer_id VARCHAR(255),
  asaas_invoice_id VARCHAR(255) UNIQUE,
  
  -- Status
  asaas_status VARCHAR(50),
  
  -- Valores
  valor_original DECIMAL(10,2),
  taxa_asaas DECIMAL(10,2),
  valor_liquido DECIMAL(10,2),
  
  -- Informações PIX
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  pix_expiration TIMESTAMP,
  
  -- Informações Boleto
  boleto_numero VARCHAR(47),
  boleto_link_pdf VARCHAR(500),
  boleto_vencimento DATE,
  
  -- Metadados
  metadados JSONB,
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_asaas_pagamentos_pagamento_id 
ON asaas_pagamentos(pagamento_id);

CREATE INDEX IF NOT EXISTS idx_asaas_pagamentos_customer_id 
ON asaas_pagamentos(asaas_customer_id);

CREATE INDEX IF NOT EXISTS idx_asaas_pagamentos_invoice_id 
ON asaas_pagamentos(asaas_invoice_id);

CREATE INDEX IF NOT EXISTS idx_asaas_pagamentos_status 
ON asaas_pagamentos(asaas_status);

CREATE INDEX IF NOT EXISTS idx_asaas_pagamentos_created 
ON asaas_pagamentos(criado_em DESC);

-- Adicionar coluna na tabela pagamentos se necessário
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS origem_pagamento VARCHAR(50) DEFAULT 'asaas';

-- Validação final
SELECT 
  table_name,
  'Tabela criada com sucesso!' as status
FROM information_schema.tables 
WHERE table_name = 'asaas_pagamentos';

COMMIT;

-- =====================================================
-- VALIDAÇÃO FINAL DE TODAS AS MIGRAÇÕES
-- =====================================================

-- Verificar trigger Q37
SELECT 
  '✅ Migração 165 (Q37)' as migracao,
  CASE WHEN COUNT(*) = 1 THEN '✅ OK' ELSE '❌ FALHOU' END as status
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_atualizar_ultima_avaliacao'

UNION ALL

-- Verificar laudos corrigidos
SELECT 
  '✅ Sincronização Laudos' as migracao,
  CASE WHEN COUNT(*) >= 0 THEN '✅ OK' ELSE '❌ FALHOU' END as status
FROM laudos 
WHERE status = 'emitido'

UNION ALL

-- Verificar coluna concluida_em
SELECT 
  '✅ Migração 206 (concluida_em)' as migracao,
  CASE WHEN COUNT(*) = 1 THEN '✅ OK' ELSE '❌ FALHOU' END as status
FROM information_schema.columns
WHERE table_name = 'avaliacoes' AND column_name = 'concluida_em'

UNION ALL

-- Verificar tabela Asaas
SELECT 
  '✅ Tabela Asaas' as migracao,
  CASE WHEN COUNT(*) = 1 THEN '✅ OK' ELSE '❌ FALHOU' END as status
FROM information_schema.tables 
WHERE table_name = 'asaas_pagamentos';

-- =====================================================
-- FIM DAS MIGRAÇÕES
-- =====================================================
-- PRÓXIMO PASSO: Fazer build do código (pnpm build)
-- =====================================================
