-- Migration: 067_audit_contratante_id.sql
-- Description: Add contratante_id to audit_logs for complete traceability
-- Date: 2026-01-04
-- Priority: P2.2 - MÉDIA (Auditoria e logs)

BEGIN;

\echo '=== MIGRATION 067: Adicionando contratante_id a audit_logs ==='

-- Add contratante_id column if not exists
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS contratante_id INTEGER;

\echo '067.1 Coluna contratante_id adicionada a audit_logs'

-- Add foreign key constraint
ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_contratante_id_fkey
FOREIGN KEY (contratante_id) REFERENCES public.contratantes (id) ON DELETE SET NULL;

\echo '067.2 FK para contratantes adicionada'

-- Create index for queries filtering by contratante
CREATE INDEX IF NOT EXISTS idx_audit_logs_contratante_id 
ON public.audit_logs (contratante_id, created_at DESC);

\echo '067.3 Índice criado para contratante_id'

-- Add comment
COMMENT ON COLUMN audit_logs.contratante_id IS 
'ID do contratante (entidade) responsável pela ação. NULL para clínicas ou ações administrativas.';

\echo '067.4 Comentário adicionado'

-- Create helper function to log actions with contratante context
CREATE OR REPLACE FUNCTION audit_log_with_context(
    p_resource VARCHAR,
    p_action VARCHAR,
    p_resource_id VARCHAR DEFAULT NULL,
    p_details TEXT DEFAULT NULL,
    p_user_cpf CHAR(11) DEFAULT NULL,
    p_clinica_id INTEGER DEFAULT NULL,
    p_contratante_id INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_log_id INTEGER;
BEGIN
    INSERT INTO audit_logs (
        resource,
        action,
        resource_id,
        details,
        user_cpf,
        clinica_id,
        contratante_id,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        p_resource,
        p_action,
        p_resource_id,
        p_details,
        COALESCE(p_user_cpf, NULLIF(current_setting('app.current_user_cpf', true), '')),
        COALESCE(p_clinica_id, NULLIF(current_setting('app.current_user_clinica_id', true), '')::INTEGER),
        COALESCE(p_contratante_id, NULLIF(current_setting('app.current_user_contratante_id', true), '')::INTEGER),
        NULLIF(current_setting('app.current_user_ip', true), ''),
        NULLIF(current_setting('app.current_user_agent', true), ''),
        NOW()
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION audit_log_with_context IS 
'Registra ação no audit_logs incluindo contexto completo (user, clínica, contratante). Usa current_setting como fallback.';

\echo '067.5 Função audit_log_with_context() criada'

-- Create view for audit trail by contratante
CREATE OR REPLACE VIEW vw_audit_trail_por_contratante AS
SELECT
    al.id,
    al.resource,
    al.action,
    al.resource_id,
    al.details,
    al.user_cpf,
    f.nome as user_nome,
    f.clinica_id,
    c.nome as clinica_nome,
    al.contratante_id,
    cont.nome as contratante_nome,
    cont.tipo as tipo_contratante,
    al.created_at,
    al.ip_address
FROM audit_logs al
LEFT JOIN funcionarios f ON al.user_cpf = f.cpf
LEFT JOIN clinicas c ON f.clinica_id = c.id
LEFT JOIN contratantes cont ON al.contratante_id = cont.id
WHERE al.created_at >= NOW() - INTERVAL '90 days'
ORDER BY al.created_at DESC;

COMMENT ON VIEW vw_audit_trail_por_contratante IS 
'Trilha de auditoria completa incluindo informações de contratante (clínica ou entidade) - últimos 90 dias';

\echo '067.6 View vw_audit_trail_por_contratante criada'

COMMIT;

\echo '=== MIGRATION 067: Concluída com sucesso ==='
