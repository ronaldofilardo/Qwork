-- Migration 085: Corrige conversão de colunas status para enum status_aprovacao_enum
-- Data: 2026-01-24

BEGIN;

-- Contratos: ajustar valores inválidos e alterar tipo
DO $$
BEGIN
  -- Atualizar linhas com status não reconhecido para 'pendente'
  UPDATE contratos SET status = 'pendente' WHERE status NOT IN (
    SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'status_aprovacao_enum'
  );

  -- Remover default que impede conversão
  ALTER TABLE contratos ALTER COLUMN status DROP DEFAULT;

  -- Alterar tipo para enum
  ALTER TABLE contratos ALTER COLUMN status TYPE status_aprovacao_enum USING status::status_aprovacao_enum;

  -- Definir default compatível
  ALTER TABLE contratos ALTER COLUMN status SET DEFAULT 'pendente';
  RAISE NOTICE 'contratos.status convertido para status_aprovacao_enum com default pendente';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Falha ao converter contratos.status: %', SQLERRM;
END $$;

-- Contratantes: similar
DO $$
BEGIN
  UPDATE contratantes SET status = 'pendente' WHERE status NOT IN (
    SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'status_aprovacao_enum'
  );

  ALTER TABLE contratantes ALTER COLUMN status DROP DEFAULT;
  ALTER TABLE contratantes ALTER COLUMN status TYPE status_aprovacao_enum USING status::status_aprovacao_enum;
  ALTER TABLE contratantes ALTER COLUMN status SET DEFAULT 'pendente';
  RAISE NOTICE 'contratantes.status convertido para status_aprovacao_enum com default pendente';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Falha ao converter contratantes.status: %', SQLERRM;
END $$;

COMMIT;
