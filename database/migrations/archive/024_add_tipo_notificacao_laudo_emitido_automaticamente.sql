-- Migration 024: Adiciona valor laudo_emitido_automaticamente ao enum tipo_notificacao

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'tipo_notificacao' AND e.enumlabel = 'laudo_emitido_automaticamente'
  ) THEN
    ALTER TYPE tipo_notificacao ADD VALUE 'laudo_emitido_automaticamente';
  END IF;
END$$;
