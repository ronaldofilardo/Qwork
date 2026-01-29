-- Migration: Allow NULL values in laudos.emissor_cpf
-- Date: 2026-01-29

BEGIN;

-- Rationale:
-- After removing the legacy placeholder emissor ('00000000000') from the trigger
-- that reserves a laudo row on lote insert, the trigger now attempts to insert a
-- laudo without providing an emissor_cpf. The column currently has a NOT NULL
-- constraint which prevents lote creation. We allow NULL so that a reserved
-- laudo can exist in 'rascunho' state without an emissor; the emission flow is
-- responsible for assigning a valid emissor before marking as emitted.

ALTER TABLE public.laudos ALTER COLUMN emissor_cpf DROP NOT NULL;

COMMIT;
