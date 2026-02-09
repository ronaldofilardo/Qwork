-- Add plano_id/plano_tipo and FK/indexes
ALTER TABLE tomadores ADD COLUMN IF NOT EXISTS plano_id INTEGER;
ALTER TABLE tomadores ADD COLUMN IF NOT EXISTS plano_tipo tipo_plano;
COMMENT ON COLUMN tomadores.plano_id IS 'Plano selecionado pelo contratante';
CREATE INDEX IF NOT EXISTS idx_tomadores_plano ON tomadores (plano_id);
CREATE INDEX IF NOT EXISTS idx_tomadores_plano_tipo ON tomadores (plano_tipo);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tomadores_plano_id_fkey') THEN
    ALTER TABLE tomadores ADD CONSTRAINT tomadores_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES planos(id);
  END IF;
END$$ LANGUAGE plpgsql;

-- Ensure sync function exists
CREATE OR REPLACE FUNCTION public.sync_contratante_plano_tipo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.plano_id IS NOT NULL AND (OLD.plano_id IS NULL OR NEW.plano_id != OLD.plano_id) THEN
        -- Atualizar plano_tipo baseado no plano_id
        SELECT tipo INTO NEW.plano_tipo
        FROM planos
        WHERE id = NEW.plano_id;
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_sync_contratante_plano_tipo ON tomadores;
CREATE TRIGGER trg_sync_contratante_plano_tipo BEFORE INSERT OR UPDATE OF plano_id ON tomadores FOR EACH ROW EXECUTE FUNCTION public.sync_contratante_plano_tipo();
