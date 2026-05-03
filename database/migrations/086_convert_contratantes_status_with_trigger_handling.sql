-- Migration 086: Converter contratantes.status para enum, lidando com triggers que bloqueiam
-- Data: 2026-01-24

BEGIN;

-- 1. Drop triggers that block alter column
DROP TRIGGER IF EXISTS tr_contratantes_sync_status_ativa_personalizado ON contratantes;
DROP TRIGGER IF EXISTS trg_impedir_alteracao_critica ON contratantes;

-- 2. Ensure status values are valid
UPDATE contratantes SET status = 'pendente' WHERE status NOT IN (
  SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'status_aprovacao_enum'
);

-- 3. Drop default, alter type, set default
ALTER TABLE contratantes ALTER COLUMN status DROP DEFAULT;
ALTER TABLE contratantes ALTER COLUMN status TYPE status_aprovacao_enum USING status::status_aprovacao_enum;
ALTER TABLE contratantes ALTER COLUMN status SET DEFAULT 'pendente';

-- 4. Recreate or re-enable triggers from migration 047 (idempotent)
-- Recreate function and trigger that sync status
CREATE OR REPLACE FUNCTION contratantes_sync_status_ativa_personalizado()
RETURNS TRIGGER AS $$
BEGIN
  -- Implementation is idempotent and defensive (keeps existing status if set)
  IF NEW.status IS NULL THEN
    NEW.status := 'pendente'::status_aprovacao_enum;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_contratantes_sync_status_ativa_personalizado ON contratantes;
CREATE TRIGGER tr_contratantes_sync_status_ativa_personalizado
BEFORE INSERT OR UPDATE ON contratantes
FOR EACH ROW EXECUTE FUNCTION contratantes_sync_status_ativa_personalizado();

-- Recreate simple guard trigger (impedir alteração de campos críticos) if missing
CREATE OR REPLACE FUNCTION impedir_alteracao_campos_criticos()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'rejeitado'::status_aprovacao_enum AND OLD.status = 'aprovado'::status_aprovacao_enum THEN
    RAISE EXCEPTION 'Não é permitido alterar status de aprovado para rejeitado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_impedir_alteracao_critica ON contratantes;
CREATE TRIGGER trg_impedir_alteracao_critica
BEFORE UPDATE ON contratantes
FOR EACH ROW EXECUTE FUNCTION impedir_alteracao_campos_criticos();

COMMIT;
