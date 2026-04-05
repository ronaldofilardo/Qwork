-- Script idempotente para corrigir constraint laudos_status_check no Neon
-- Garante que os valores permitidos sejam: 'rascunho','emitido','enviado'
BEGIN;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laudos_status_check') THEN
        ALTER TABLE laudos DROP CONSTRAINT laudos_status_check;
        RAISE NOTICE 'Constraint laudos_status_check removida';
    ELSE
        RAISE NOTICE 'Constraint laudos_status_check nao existe';
    END IF;

    ALTER TABLE laudos
    ADD CONSTRAINT laudos_status_check CHECK (status::text = ANY (ARRAY['rascunho'::text, 'emitido'::text, 'enviado'::text]));
    RAISE NOTICE 'Constraint laudos_status_check criada com valores rascunho, emitido, enviado';
END $$;

COMMIT;
