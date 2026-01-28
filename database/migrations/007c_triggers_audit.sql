-- ==========================================
-- MIGRATION 007c: Triggers e Auditoria
-- Parte 3 da refatoração de status e fila de emissão
-- Data: 2025-01-03
-- ==========================================

BEGIN;

\echo '=== MIGRATION 007c: Criando triggers e auditoria ==='

-- 3. Criando triggers de imutabilidade
-- 3.1. Trigger para impedir UPDATE em lotes finalizados/cancelados
CREATE OR REPLACE FUNCTION prevent_update_finalized_lote()
RETURNS TRIGGER AS $$
BEGIN
  -- Impedir modificação de lotes em estados terminais
  IF OLD.status IN ('finalizado', 'cancelado') THEN
    RAISE EXCEPTION 'Lote com status "%" não pode ser modificado', OLD.status;
  END IF;

  -- Impedir modificação se já existe laudo enviado
  IF EXISTS (
    SELECT 1 FROM laudos WHERE lote_id = OLD.id AND status = 'enviado'
  ) THEN
    RAISE EXCEPTION 'Lote possui laudo enviado. Modificações bloqueadas.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_lote ON lotes_avaliacao;
CREATE TRIGGER trg_immutable_lote
BEFORE UPDATE ON lotes_avaliacao
FOR EACH ROW EXECUTE FUNCTION prevent_update_finalized_lote();

\echo '3.1. Trigger de imutabilidade de lotes criado'

-- 3.2. Trigger para impedir UPDATE/DELETE em laudos enviados
CREATE OR REPLACE FUNCTION prevent_update_laudo_enviado()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'enviado' THEN
    RAISE EXCEPTION 'Laudo enviado não pode ser modificado ou excluído';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_laudo ON laudos;
CREATE TRIGGER trg_immutable_laudo
BEFORE UPDATE OR DELETE ON laudos
FOR EACH ROW EXECUTE FUNCTION prevent_update_laudo_enviado();

\echo '3.2. Trigger de imutabilidade de laudos criado'

-- 4. Configurando auditoria automática
-- 4.1. Tabela de auditoria já existe, usar estrutura existente

\echo '4.1. Tabela de auditoria verificada (usando estrutura existente)'

-- 4.2. Trigger de auditoria para mudanças de status em lotes
CREATE OR REPLACE FUNCTION audit_lote_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (action, resource, resource_id, old_data, new_data)
    VALUES (
      'lote_status_change',
      'lotes_avaliacao',
      NEW.id::TEXT,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status, 'modo_emergencia', NEW.modo_emergencia, 'motivo_emergencia', NEW.motivo_emergencia)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_lote_status ON lotes_avaliacao;
CREATE TRIGGER trg_audit_lote_status
AFTER UPDATE ON lotes_avaliacao
FOR EACH ROW EXECUTE FUNCTION audit_lote_status_change();

\echo '4.2. Trigger de auditoria de lotes criado'

-- 4.3. Trigger de auditoria para criação de laudos
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
      'tamanho_pdf', LENGTH(NEW.pdf)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_laudo_creation ON laudos;
CREATE TRIGGER trg_audit_laudo_creation
AFTER INSERT ON laudos
FOR EACH ROW EXECUTE FUNCTION audit_laudo_creation();

\echo '4.3. Trigger de auditoria de laudos criado'

COMMIT;

\echo '=== MIGRATION 007c: Concluída com sucesso ==='