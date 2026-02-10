-- Migration 1011: Corrigir audit_lote_change() remover referência a processamento_em
-- Data: 2026-02-10
-- Problema: Trigger ainda referencia coluna processamento_em removida na Migration 130
-- Erro: "record "old" has no field "processamento_em"" ao atualizar lotes_avaliacao

-- =============================================================================
-- CORRIGIR FUNÇÃO audit_lote_change() - REMOVER processamento_em
-- =============================================================================

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
      COALESCE(current_setting('app.current_user_cpf', true), 'system'),
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
    -- Registrar apenas mudanças significativas (SEM processamento_em)
    IF OLD.status IS DISTINCT FROM NEW.status OR
       OLD.emitido_em IS DISTINCT FROM NEW.emitido_em OR
       OLD.enviado_em IS DISTINCT FROM NEW.enviado_em THEN
      
      INSERT INTO audit_logs (
        user_cpf,
        action,
        resource,
        resource_id,
        details,
        ip_address
      ) VALUES (
        COALESCE(current_setting('app.current_user_cpf', true), 'system'),
        'lote_atualizado',
        'lotes_avaliacao',
        NEW.id,
        jsonb_build_object(
          'lote_id', NEW.id,
          'status', NEW.status,
          'emitido_em', NEW.emitido_em,
          'enviado_em', NEW.enviado_em,
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
      COALESCE(current_setting('app.current_user_cpf', true), 'system'),
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
'Trigger de auditoria para lotes. Migration 1011: Corrigida para remover campo obsoleto.';

-- =============================================================================
-- AUDITORIA: Registrar aplicação da migration
-- =============================================================================

INSERT INTO audit_logs (
  user_cpf,
  user_perfil,
  action,
  resource,
  details
) VALUES (
  NULL,
  'system',
  'MIGRATION_APPLIED',
  'audit_lote_change',
  jsonb_build_object(
    'migration', '1011',
    'descricao', 'Removida referência a campo obsoleto do trigger de auditoria',
    'data_aplicacao', NOW()
  )
);
