-- Ajuste em contratantes_sync_status_ativa: não sobrescrever status se já fornecido
CREATE OR REPLACE FUNCTION public.contratantes_sync_status_ativa()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.ativa IS NOT NULL AND NEW.ativa = false AND NEW.status IS NULL THEN
      NEW.status := 'inativa';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF (OLD.ativa IS DISTINCT FROM NEW.ativa) AND NEW.ativa = false AND NEW.status IS NULL THEN
      NEW.status := 'inativa';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;