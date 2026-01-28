-- Migration: 079_fix_audit_laudo_creation_column.sql
-- Description: Fix audit_laudo_creation trigger to use correct column name (arquivo_pdf instead of pdf)
-- Date: 2025-01-06
-- Target: Test database compatibility (fixes "registro new não tem campo pdf" error)

\echo '079.1 Corrigindo função audit_laudo_creation() para usar coluna arquivo_pdf'

CREATE OR REPLACE FUNCTION audit_laudo_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar criação de laudo no audit_logs
  INSERT INTO audit_logs (action, resource, resource_id, new_data)
  VALUES (
    'laudo_criado',
    'laudos',
    NEW.id::TEXT,
    jsonb_build_object(
      'lote_id', NEW.lote_id,
      'status', NEW.status,
      'tamanho_pdf', COALESCE(LENGTH(NEW.arquivo_pdf), 0),
      'hash_pdf', NEW.hash_pdf
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION audit_laudo_creation() IS 'Audita criação de laudos usando a coluna arquivo_pdf para tamanho do PDF';

\echo '079.2 Função audit_laudo_creation() corrigida com sucesso'
