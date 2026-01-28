-- SCRIPT DEFINITIVO: Remove toda infraestrutura de contratos pré-pagamento
-- ATENÇÃO: Este script faz alterações DESTRUTIVAS e IRREVERSÍVEIS
-- Execute apenas em DEV/TEST - NUNCA em produção sem backup

BEGIN;

-- 1. Remover colunas de contratos da tabela contratantes
ALTER TABLE IF EXISTS contratantes
  DROP COLUMN IF EXISTS contrato_gerado CASCADE,
  DROP COLUMN IF EXISTS contrato_aceito CASCADE,
  DROP COLUMN IF EXISTS contrato_id CASCADE;

-- 2. Atualizar status obsoleto para aguardando_pagamento  
UPDATE contratantes 
SET status = 'aguardando_pagamento'
WHERE status = 'contrato_gerado_pendente';

-- 3. Remover foreign key de pagamentos para contratos
ALTER TABLE IF EXISTS pagamentos
  DROP CONSTRAINT IF EXISTS pagamentos_contrato_id_fkey CASCADE;

-- 4. Remover coluna contrato_id de pagamentos (se existe)
ALTER TABLE IF EXISTS pagamentos
  DROP COLUMN IF EXISTS contrato_id CASCADE;

-- 5. Remover coluna contrato_id de recibos (se existe)
ALTER TABLE IF EXISTS recibos
  DROP COLUMN IF EXISTS contrato_id CASCADE;

-- 6. Dropar tabela contratos completamente
DROP TABLE IF EXISTS contratos CASCADE;

-- 7. Remover funções relacionadas a contratos (se existirem)
DROP FUNCTION IF EXISTS validar_aceite_contrato() CASCADE;
DROP FUNCTION IF EXISTS gerar_numero_contrato() CASCADE;
DROP FUNCTION IF EXISTS trigger_gerar_numero_contrato() CASCADE;

-- 8. Log de conclusão
DO $$
BEGIN
  RAISE NOTICE '✅ Limpeza completa de contratos pré-pagamento executada com sucesso';
  RAISE NOTICE '   - Colunas contrato_gerado, contrato_aceito, contrato_id removidas de contratantes';
  RAISE NOTICE '   - Status contrato_gerado_pendente atualizado para aguardando_pagamento';
  RAISE NOTICE '   - Coluna contrato_id removida de pagamentos e recibos';
  RAISE NOTICE '   - Tabela contratos deletada';
  RAISE NOTICE '   - Funções relacionadas removidas';
END $$;

COMMIT;
