-- Idempotent migration to ensure entidades_senhas has expected columns
BEGIN;

ALTER TABLE entidades_senhas
  ADD COLUMN IF NOT EXISTS contratante_id integer;

-- Add timestamps
ALTER TABLE entidades_senhas
  ADD COLUMN IF NOT EXISTS criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE entidades_senhas
  ADD COLUMN IF NOT EXISTS atualizado_em timestamp with time zone;

-- If contratante_id is null but there is a contratante relation elsewhere, we do not attempt to auto-fill here.
-- Set atualizado_em to criado_em for existing rows to avoid null timestamp issues
UPDATE entidades_senhas SET atualizado_em = COALESCE(atualizado_em, criado_em);

-- Create an index/unique constraint for quick lookup if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'entidades_senhas' AND indexname = 'entidades_senhas_contratante_cpf_unique'
  ) THEN
    BEGIN
      CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS entidades_senhas_contratante_cpf_unique ON entidades_senhas (contratante_id, cpf);
    EXCEPTION WHEN others THEN
      -- Ignore errors when running inside transactions in some environments
      RAISE NOTICE 'Index creation skipped: %', SQLERRM;
    END;
  END IF;
END$$;

COMMIT;
