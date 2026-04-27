-- Migration: 1232 — Fix audit_lote_change fallback user_cpf
-- Substitui COALESCE(..., 'system') por NULLIF(..., '') para que
-- execuções sem contexto de sessão (ex: psql direto, triggers) não
-- violem a constraint chk_audit_logs_user_cpf_format (exige length=11 ou NULL).
BEGIN;

CREATE OR REPLACE FUNCTION audit_lote_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $BODY$
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
      NULLIF(current_setting('app.current_user_cpf', true), ''),
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
        NULLIF(current_setting('app.current_user_cpf', true), ''),
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
      NULLIF(current_setting('app.current_user_cpf', true), ''),
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
$BODY$;

COMMIT;
