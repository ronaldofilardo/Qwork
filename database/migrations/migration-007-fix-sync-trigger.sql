-- Migration: Corrigir trigger de sincronização de status/ativa
-- Data: 2025-12-26
-- Objetivo: Remover lógica incorreta que força ativa=true para aguardando_pagamento

-- PROBLEMA: O trigger antigo forçava ativa=true para status aguardando_pagamento
-- SOLUÇÃO: Novo fluxo: ativação só deve ser true APÓS confirmação de pagamento

DROP TRIGGER IF EXISTS tr_tomadores_sync_status_ativa_robust ON tomadores;
DROP FUNCTION IF EXISTS tomadores_sync_status_ativa_robust();

-- Nova função corrigida para sincronização de ativa/status
CREATE OR REPLACE FUNCTION tomadores_sync_status_ativa()
RETURNS TRIGGER AS $$
BEGIN
  -- Ativa NUNCA pode ser true sem pagamento confirmado
  -- A constraint chk_ativa_exige_pagamento já protege isso, mas este trigger
  -- garante consistência preventiva
  
  IF NEW.ativa = true AND NEW.pagamento_confirmado = false THEN
    RAISE EXCEPTION 'Não é possível ativar contratante sem pagamento confirmado';
  END IF;
  
  -- Se pagamento foi confirmado mas contratante não está ativo, ativar
  IF NEW.pagamento_confirmado = true AND NEW.ativa = false THEN
    NEW.ativa := true;
    RAISE NOTICE 'Contratante %: Pagamento confirmado, ativando automaticamente', NEW.id;
  END IF;
  
  -- Se pagamento foi removido/cancelado, desativar
  IF NEW.pagamento_confirmado = false AND OLD.pagamento_confirmado = true THEN
    NEW.ativa := false;
    RAISE NOTICE 'Contratante %: Pagamento cancelado, desativando', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar novo trigger
CREATE TRIGGER tr_tomadores_sync_status_ativa
  BEFORE INSERT OR UPDATE ON tomadores
  FOR EACH ROW
  EXECUTE FUNCTION tomadores_sync_status_ativa();

COMMENT ON FUNCTION tomadores_sync_status_ativa IS 
'Garante que ativa só é true quando pagamento_confirmado é true. Remove lógica antiga que forçava ativa=true para aguardando_pagamento.';

-- Resumo
SELECT 'Migration 007 concluída: trigger corrigido para sincronização de ativa/status' AS status;
