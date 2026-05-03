-- Migration 047: Corrigir trigger para ativação de conta após pagamento
-- Data: 2025-12-26
-- Descrição: Sincronizar status com ativa nos tomadores

BEGIN;

-- Função robusta para sincronizar status com ativa
CREATE OR REPLACE FUNCTION tomadores_sync_status_ativa_personalizado()
RETURNS trigger AS $$
DECLARE
    v_status_ativo status_aprovacao_enum[] := ARRAY['aprovado'::status_aprovacao_enum];
    v_status_inativo status_aprovacao_enum[] := ARRAY['rejeitado'::status_aprovacao_enum];
BEGIN
  -- Para inserts e updates
  IF TG_OP IN ('INSERT', 'UPDATE') THEN

    -- Regra 1: Status aprovado → ativa deve ser true
    IF NEW.status = ANY(v_status_ativo) AND NEW.ativa IS NOT TRUE THEN
      NEW.ativa := true;
      RAISE NOTICE 'Contratante %: Status % requer ativa=true, corrigindo', NEW.id, NEW.status;
    END IF;

    -- Regra 2: Status rejeitado → ativa deve ser false
    IF NEW.status = ANY(v_status_inativo) AND NEW.ativa IS NOT FALSE THEN
      NEW.ativa := false;
      RAISE NOTICE 'Contratante %: Status % requer ativa=false, corrigindo', NEW.id, NEW.status;
    END IF;

    -- Regra 3: Se ativa=true mas status não é aprovado → corrigir para 'aprovado'
    IF NEW.ativa = true AND NOT (NEW.status = ANY(v_status_ativo)) THEN
      NEW.status := 'aprovado'::status_aprovacao_enum;
      RAISE NOTICE 'Contratante %: ativa=true requer status aprovado, definindo status=aprovado', NEW.id;
    END IF;

    -- Regra 4: Se ativa=false mas status é aprovado → corrigir para 'rejeitado'
    IF NEW.ativa = false AND NEW.status = ANY(v_status_ativo) THEN
      NEW.status := 'rejeitado'::status_aprovacao_enum;
      RAISE NOTICE 'Contratante %: ativa=false com status aprovado, definindo status=rejeitado', NEW.id;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Substituir trigger pela nova versão
DROP TRIGGER IF EXISTS tr_tomadores_sync_status_ativa_robust ON tomadores;
CREATE TRIGGER tr_tomadores_sync_status_ativa_personalizado
BEFORE INSERT OR UPDATE ON tomadores
FOR EACH ROW EXECUTE FUNCTION tomadores_sync_status_ativa_personalizado();

COMMIT;