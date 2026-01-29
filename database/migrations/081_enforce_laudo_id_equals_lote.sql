-- Migration 081: Enforce laudos.id == laudos.lote_id via trigger
-- Date: 2026-01-28

BEGIN;

-- 1. Create trigger function to enforce id equality and prevent duplicates
CREATE OR REPLACE FUNCTION trg_enforce_laudo_id_equals_lote()
RETURNS trigger AS $$
BEGIN
  -- If insert doesn't specify id or id differs, set id to lote_id
  IF NEW.id IS NULL OR NEW.id IS DISTINCT FROM NEW.lote_id THEN
    NEW.id := NEW.lote_id;
  END IF;

  -- Prevent creating a laudo when another laudo with same id exists (should be same as lote)
  IF EXISTS (SELECT 1 FROM laudos WHERE id = NEW.id) THEN
    RAISE EXCEPTION 'Laudo with id % already exists', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach trigger BEFORE INSERT on laudos
DROP TRIGGER IF EXISTS trg_enforce_laudo_id_equals_lote ON laudos;
CREATE TRIGGER trg_enforce_laudo_id_equals_lote
BEFORE INSERT ON laudos
FOR EACH ROW
EXECUTE FUNCTION trg_enforce_laudo_id_equals_lote();

COMMIT;

-- Rollback manual (if necessary):
-- BEGIN; DROP TRIGGER IF EXISTS trg_enforce_laudo_id_equals_lote ON laudos; DROP FUNCTION IF EXISTS trg_enforce_laudo_id_equals_lote(); COMMIT;
