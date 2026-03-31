-- Migration 1131: Adicionar link_disponibilizado_em e tipo_notificacao pagamento_pendente
-- Contexto: Fluxo de pagamento — suporte disponibiliza link na conta do tomador

-- Coluna para controlar quando o suporte disponibilizou o link de pagamento ao tomador
ALTER TABLE lotes_avaliacao
  ADD COLUMN IF NOT EXISTS link_disponibilizado_em TIMESTAMPTZ NULL;

-- Novo tipo de notificação para pagamento pendente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'pagamento_pendente'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tipo_notificacao')
  ) THEN
    ALTER TYPE tipo_notificacao ADD VALUE 'pagamento_pendente';
  END IF;
END $$;
