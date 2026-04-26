-- Migration 1125: Adiciona 'pendente_consolidacao' ao enum status_comissao
-- Novo fluxo: comissões aguardam fechamento do ciclo mensal antes de exigir NF.
-- O status 'pendente_nf' fica preservado para dados históricos.

BEGIN;

-- 1. Adicionar novo status ao enum
ALTER TYPE public.status_comissao ADD VALUE IF NOT EXISTS 'pendente_consolidacao';

-- 2. Confirmar que ciclo_id já existe em comissoes_laudo (criado em migration 1124)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'comissoes_laudo'
      AND column_name = 'ciclo_id'
  ) THEN
    RAISE EXCEPTION 'Coluna ciclo_id não encontrada em comissoes_laudo. Execute a migration 1124 primeiro.';
  END IF;
END;
$$;

COMMIT;
