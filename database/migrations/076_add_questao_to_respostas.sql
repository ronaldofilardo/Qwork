-- Migration 076: adicionar coluna 'questao' em respostas e trigger para popular a partir de 'item'
-- Aplicar primeiro no banco de teste (nr-bps_db_test). Não valida/normalize dados históricos automaticamente para evitar conflitos com triggers de imutabilidade.

BEGIN;

-- Adicionar coluna se não existe
ALTER TABLE respostas
  ADD COLUMN IF NOT EXISTS questao integer;

-- Função que popula 'questao' a partir de 'item' quando disponível
CREATE OR REPLACE FUNCTION public.set_questao_from_item()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  IF (NEW.questao IS NULL OR NEW.questao = 0) AND NEW.item IS NOT NULL THEN
    -- Extrair dígitos de 'item' e converter para inteiro (ex.: 'q1' -> 1, '1' -> 1)
    IF NEW.item ~ '\d' THEN
      NEW.questao := (regexp_replace(NEW.item, '\D', '', 'g'))::integer;
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;

-- Criar trigger apenas se não existir
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_respostas_set_questao'
  ) THEN
    EXECUTE 'CREATE TRIGGER trg_respostas_set_questao
      BEFORE INSERT OR UPDATE ON respostas
      FOR EACH ROW
      EXECUTE FUNCTION public.set_questao_from_item();';
  END IF;
END;
$do$;

COMMIT;
