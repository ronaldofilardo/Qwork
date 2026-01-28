-- Migration 074: Tornar audit_lote_status_change defensiva contra ausência de colunas (uso em bancos de teste)
-- Data: 2026-01-05

BEGIN;

-- Substituir função audit_lote_status_change para evitar acessar NEW.modo_emergencia diretamente
CREATE OR REPLACE FUNCTION audit_lote_status_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (action, resource, resource_id, old_data, new_data)
    VALUES (
      'lote_status_change',
      'lotes_avaliacao',
      NEW.id::TEXT,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object(
        'status', NEW.status,
        'modo_emergencia', (to_jsonb(NEW) ->> 'modo_emergencia')::boolean,
        'motivo_emergencia', (to_jsonb(NEW) ->> 'motivo_emergencia')::text
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION audit_lote_status_change() IS 'Função de auditoria de mudança de status de lote (defensiva)';

SELECT '074.1 Função audit_lote_status_change atualizada para ser defensiva' as status;

COMMIT;
