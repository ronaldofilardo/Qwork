-- Adds audit columns to contratantes_senhas and a minimal trigger
-- to synchronize status from contratacao_personalizada -> contratantes
BEGIN;

ALTER TABLE contratantes_senhas
  ADD COLUMN IF NOT EXISTS criado_em timestamptz DEFAULT NOW();

ALTER TABLE contratantes_senhas
  ADD COLUMN IF NOT EXISTS atualizado_em timestamptz DEFAULT NOW();

-- Minimal trigger function: when a contratacao_personalizada row is inserted/updated
-- and its status becomes 'valor_definido', update the contratante's status too.
CREATE OR REPLACE FUNCTION sync_contratacao_status_to_contratante()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.status IS NOT NULL AND NEW.status = 'valor_definido' THEN
      UPDATE contratantes SET status = 'valor_definido' WHERE id = NEW.contratante_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_contratacao_status ON contratacao_personalizada;
CREATE TRIGGER trg_sync_contratacao_status
  AFTER INSERT OR UPDATE ON contratacao_personalizada
  FOR EACH ROW
  EXECUTE FUNCTION sync_contratacao_status_to_contratante();

COMMIT;
