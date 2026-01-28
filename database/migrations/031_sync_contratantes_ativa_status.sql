-- Migration 031: sincronizar campo "ativa" com "status"
-- Quando uma contratante é marcada como inativa (ativa = false), definir status = 'inativa'

BEGIN;

-- Função para sincronizar status com ativa
CREATE OR REPLACE FUNCTION contratantes_sync_status_ativa()
RETURNS trigger AS $$
BEGIN
  -- Para inserts: se ativa=false, garantir status = 'inativa'
  IF TG_OP = 'INSERT' THEN
    IF NEW.ativa IS NOT NULL AND NEW.ativa = false THEN
      NEW.status := 'inativa';
    END IF;
    RETURN NEW;
  END IF;

  -- Para updates: se houve mudança de ativa para false, definir status = 'inativa'
  IF TG_OP = 'UPDATE' THEN
    IF (OLD.ativa IS DISTINCT FROM NEW.ativa) AND NEW.ativa = false THEN
      NEW.status := 'inativa';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS tr_contratantes_sync_status_ativa ON contratantes;
CREATE TRIGGER tr_contratantes_sync_status_ativa
BEFORE INSERT OR UPDATE ON contratantes
FOR EACH ROW EXECUTE FUNCTION contratantes_sync_status_ativa();

COMMIT;
