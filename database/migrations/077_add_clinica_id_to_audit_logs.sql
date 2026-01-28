-- Migration 077: adicionar coluna clinica_id em audit_logs
-- Razão: função audit_log_with_context insere clinica_id; garantir coluna para compatibilidade

BEGIN;

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS clinica_id INTEGER;

-- Foreign key (opcional, defensivo) (criar se não existir)
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_clinica_id_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas (id) ON DELETE SET NULL';
  END IF;
END;
$do$;

CREATE INDEX IF NOT EXISTS idx_audit_logs_clinica_id ON public.audit_logs (clinica_id);

COMMENT ON COLUMN public.audit_logs.clinica_id IS 'ID da clínica relacionada à ação (quando aplicável).';

COMMIT;
