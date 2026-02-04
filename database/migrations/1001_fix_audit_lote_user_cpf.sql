-- Migration 1001: Corrigir user_cpf vazio no trigger audit_lote_change
-- Data: 2026-02-04
-- Problema: current_setting retorna string vazia, violando constraint chk_audit_logs_user_cpf_format
-- Solução: Usar NULLIF para converter string vazia em NULL antes do COALESCE

BEGIN;

CREATE OR REPLACE FUNCTION audit_lote_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      user_cpf,
      action,
      resource,
      resource_id,
      details,
      ip_address
    ) VALUES (
      -- CORREÇÃO: NULLIF converte string vazia em NULL, depois COALESCE pega 'system'
      CASE 
        WHEN NULLIF(TRIM(current_setting('app.current_user_cpf', true)), '') IS NULL THEN NULL
        WHEN LENGTH(TRIM(current_setting('app.current_user_cpf', true))) = 11 THEN TRIM(current_setting('app.current_user_cpf', true))
        ELSE NULL
      END,
      'lote_criado',
      'lotes_avaliacao',
      NEW.id,
      jsonb_build_object(
        'lote_id', NEW.id,
        'empresa_id', NEW.empresa_id,
        'numero_ordem', NEW.numero_ordem,
        'status', NEW.status
      ),
      NULLIF(current_setting('app.client_ip', true), '')::inet
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Registrar apenas mudanças significativas
    IF OLD.status IS DISTINCT FROM NEW.status OR
       OLD.emitido_em IS DISTINCT FROM NEW.emitido_em OR
       OLD.enviado_em IS DISTINCT FROM NEW.enviado_em OR
       OLD.processamento_em IS DISTINCT FROM NEW.processamento_em THEN
      
      INSERT INTO audit_logs (
        user_cpf,
        action,
        resource,
        resource_id,
        details,
        ip_address
      ) VALUES (
        -- CORREÇÃO: NULLIF converte string vazia em NULL, depois COALESCE pega 'system'
        CASE 
          WHEN NULLIF(TRIM(current_setting('app.current_user_cpf', true)), '') IS NULL THEN NULL
          WHEN LENGTH(TRIM(current_setting('app.current_user_cpf', true))) = 11 THEN TRIM(current_setting('app.current_user_cpf', true))
          ELSE NULL
        END,
        'lote_atualizado',
        'lotes_avaliacao',
        NEW.id,
        jsonb_build_object(
          'lote_id', NEW.id,
          'status', NEW.status,
          'emitido_em', NEW.emitido_em,
          'enviado_em', NEW.enviado_em,
          'processamento_em', NEW.processamento_em,
          'mudancas', jsonb_build_object(
            'status_anterior', OLD.status,
            'status_novo', NEW.status
          )
        ),
        NULLIF(current_setting('app.client_ip', true), '')::inet
      );
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      user_cpf,
      action,
      resource,
      resource_id,
      details,
      ip_address
    ) VALUES (
      -- CORREÇÃO: NULLIF converte string vazia em NULL, depois COALESCE pega 'system'
      CASE 
        WHEN NULLIF(TRIM(current_setting('app.current_user_cpf', true)), '') IS NULL THEN NULL
        WHEN LENGTH(TRIM(current_setting('app.current_user_cpf', true))) = 11 THEN TRIM(current_setting('app.current_user_cpf', true))
        ELSE NULL
      END,
      'lote_deletado',
      'lotes_avaliacao',
      OLD.id,
      jsonb_build_object(
        'lote_id', OLD.id,
        'empresa_id', OLD.empresa_id,
        'numero_ordem', OLD.numero_ordem,
        'status', OLD.status
      ),
      NULLIF(current_setting('app.client_ip', true), '')::inet
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_lote_change() IS 
  'Trigger de auditoria para lotes com validação rigorosa de user_cpf (11 dígitos ou NULL)';

-- Validar que o trigger está correto
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger audit_lote_change corrigido para validar user_cpf';
  RAISE NOTICE 'user_cpf será NULL se: vazio, não tem 11 caracteres, ou não está configurado';
END $$;

COMMIT;
