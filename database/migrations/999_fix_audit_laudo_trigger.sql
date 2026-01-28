-- Migration: 999_fix_audit_laudo_trigger.sql
-- Description: Fix audit_laudo_creation trigger to use correct PDF column
-- Date: 2026-01-04

-- Drop the existing trigger function
DROP TRIGGER IF EXISTS trg_audit_laudo_creation ON laudos;
DROP FUNCTION IF EXISTS audit_laudo_creation();

-- Recreate the function with correct column reference
CREATE OR REPLACE FUNCTION audit_laudo_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (action, resource, resource_id, new_data)
  VALUES (
    'laudo_criado',
    'laudos',
    NEW.id::TEXT,
    jsonb_build_object(
      'lote_id', NEW.lote_id,
      'status', NEW.status,
      'tamanho_pdf', LENGTH(NEW.relatorio_lote)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trg_audit_laudo_creation
AFTER INSERT ON laudos
FOR EACH ROW EXECUTE FUNCTION audit_laudo_creation();

COMMENT ON FUNCTION audit_laudo_creation() IS 'Audita criação de laudos usando a coluna relatorio_lote para tamanho do PDF';