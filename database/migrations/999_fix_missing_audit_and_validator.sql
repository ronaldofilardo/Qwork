-- Migration: 999_fix_missing_audit_and_validator.sql
-- Fix: create audit_logs table if missing and add wrapper function validar_lote_para_laudo
-- Date: 2026-01-15

-- Create audit_logs if missing
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_cpf CHAR(11) NOT NULL,
    user_perfil VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_cpf ON public.audit_logs (user_cpf);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs (resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria para rastreamento de todas as ações críticas no sistema';

-- Wrapper function to maintain backward compatibility
CREATE OR REPLACE FUNCTION public.validar_lote_para_laudo(p_lote_id INTEGER)
RETURNS TABLE(valido BOOLEAN, alertas TEXT[], funcionarios_pendentes INTEGER, detalhes JSONB)
AS $$
BEGIN
  RETURN QUERY SELECT * FROM validar_lote_pre_laudo(p_lote_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.validar_lote_para_laudo(INTEGER) IS 'Wrapper for validar_lote_pre_laudo for compatibility';
