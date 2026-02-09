-- Migration 033: Trigger robusta para sincronização status-ativa
-- Data: 2025-12-22
-- Descrição: Garantir sincronização bidirecional entre status e ativa

BEGIN;

-- Função robusta para sincronizar status com ativa (bidirecional)
CREATE OR REPLACE FUNCTION tomadores_sync_status_ativa_robust()
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

    -- Regra 2: Status rejeitado/inativa → ativa deve ser false
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

-- Substituir trigger antiga pela nova
DROP TRIGGER IF EXISTS tr_tomadores_sync_status_ativa ON tomadores;
DROP TRIGGER IF EXISTS tr_tomadores_sync_status_ativa_robust ON tomadores;
CREATE TRIGGER tr_tomadores_sync_status_ativa_robust
BEFORE INSERT OR UPDATE ON tomadores
FOR EACH ROW EXECUTE FUNCTION tomadores_sync_status_ativa_robust();

-- Corrigir dados existentes inconsistentes
UPDATE tomadores
SET ativa = true
WHERE status IN ('aprovado')
AND ativa = false;

UPDATE tomadores
SET ativa = false
WHERE status IN ('rejeitado')
AND ativa = true;

UPDATE tomadores
SET status = 'aprovado'::status_aprovacao_enum
WHERE status NOT IN ('aprovado')
AND ativa = true;

UPDATE tomadores
SET status = 'rejeitado'::status_aprovacao_enum
WHERE status NOT IN ('rejeitado')
AND ativa = false;

-- Log das correções
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN
        RAISE NOTICE 'Corrigidos % registros inconsistentes em tomadores', v_count;
    ELSE
        RAISE NOTICE 'Nenhuma inconsistência encontrada em tomadores';
    END IF;
END $$;

COMMIT;