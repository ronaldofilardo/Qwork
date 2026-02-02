-- Migration: 152_add_tipo_notificacao_emissao_solicitada.sql
-- Date: 2026-02-01
-- Description: Adiciona novo valor ao enum tipo_notificacao para suportar notificações de solicitação de emissão

BEGIN;

DO $$
BEGIN
  -- Só adicionar se o tipo existir e o label não existir (compatibilidade com bancos de teste/dev)
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_notificacao') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'tipo_notificacao' AND e.enumlabel = 'emissao_solicitada_sucesso'
    ) THEN
      ALTER TYPE tipo_notificacao ADD VALUE 'emissao_solicitada_sucesso';
    END IF;
  END IF;
END$$;

COMMIT;
