-- ============================================================================
-- CORREÇÃO: Remover trigger obsoleta fn_sincronizar_contrato_id
-- Data: 13/01/2026
-- Motivo: Fluxo contract-first não usa coluna contrato_id em tomadores
-- ============================================================================

-- Contexto:
-- A trigger trg_sincronizar_contrato_aceito tentava atualizar a coluna
-- 'contrato_id' na tabela 'tomadores' quando um contrato era aceito.
-- Essa coluna não existe mais no novo fluxo contract-first onde:
-- - Contratos são criados ANTES do pagamento
-- - Relação é mantida apenas via contratante_id na tabela contratos
-- - Não há necessidade de duplicar essa referência em tomadores

-- Remover trigger obsoleta
DROP TRIGGER IF EXISTS trg_sincronizar_contrato_aceito ON contratos CASCADE;

-- Remover função obsoleta
DROP FUNCTION IF EXISTS fn_sincronizar_contrato_id() CASCADE;

-- Confirmar remoção
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_sincronizar_contrato_aceito'
  ) THEN
    RAISE EXCEPTION 'Trigger ainda existe!';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'fn_sincronizar_contrato_id'
  ) THEN
    RAISE EXCEPTION 'Função ainda existe!';
  END IF;
  
  RAISE NOTICE '✅ Trigger e função obsoletas removidas com sucesso!';
END $$;
