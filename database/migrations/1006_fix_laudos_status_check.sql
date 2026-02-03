-- Migration 1006: Corrigir constraint laudos_status_check para aceitar 'rascunho'
BEGIN;

DO $$
BEGIN
    -- Drop existing constraint if present
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laudos_status_check') THEN
        ALTER TABLE laudos DROP CONSTRAINT laudos_status_check;
    END IF;

    -- Create correct check constraint
    ALTER TABLE laudos
    ADD CONSTRAINT laudos_status_check CHECK (status::text = ANY (ARRAY['rascunho'::text, 'emitido'::text, 'enviado'::text]));
END $$;

COMMIT;
