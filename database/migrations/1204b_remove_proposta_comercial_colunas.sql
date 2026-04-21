-- =============================================================================
-- Migration 1204: Remoção Definitiva — Colunas de Proposta Comercial
-- Data: 2026-04-13
-- Objetivo: Remover as últimas colunas remanescentes do mecanismo de proposta
--           comercial (plano fixo / personalizado) que foi descontinuado.
--
-- CONTEXTO:
--   As tabelas planos, contratos_planos, etc., já foram removidas pelas
--   migrations 533 e 1136. Restam apenas colunas legadas nas tabelas
--   contratos e clinicas que nunca mais são escritas/lidas pelo sistema ativo.
--
-- COLUNAS REMOVIDAS:
--   - contratos.hash_contrato     → era gerado por SHA-256 do conteúdo (proposta comercial)
--   - contratos.conteudo_gerado   → versão personalizada do contrato de proposta
--   - contratos.pagamento_confirmado → flag do sistema legado de confirmação via plano
--   - clinicas.data_liberacao_login  → era usada para liberar login após pagamento de plano
--
-- SEGURANÇA: Todos os comandos usam IF EXISTS → 100% idempotente
-- BANCOS ALVO: nr-bps_db (DEV), nr-bps_db_test (TEST)
-- =============================================================================

-- contratos: remover colunas de proposta comercial
ALTER TABLE public.contratos
  DROP COLUMN IF EXISTS hash_contrato CASCADE,
  DROP COLUMN IF EXISTS conteudo_gerado CASCADE,
  DROP COLUMN IF EXISTS pagamento_confirmado CASCADE;

-- clinicas: remover coluna de liberação de login por plano
ALTER TABLE public.clinicas
  DROP COLUMN IF EXISTS data_liberacao_login CASCADE;

-- Verificação pós-remoção
DO $$
DECLARE
  col_count INT;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND (
      (table_name = 'contratos' AND column_name IN ('hash_contrato', 'conteudo_gerado', 'pagamento_confirmado'))
      OR (table_name = 'clinicas' AND column_name = 'data_liberacao_login')
    );

  IF col_count > 0 THEN
    RAISE WARNING 'Migration 1204: % colunas legadas de proposta comercial ainda presentes', col_count;
  ELSE
    RAISE NOTICE 'Migration 1204: Colunas de proposta comercial removidas com sucesso';
  END IF;
END $$;
