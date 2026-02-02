-- Migration: Permitir backfill de hash_pdf em laudos emitidos
-- Permite apenas a atualização do campo hash_pdf quando está NULL ou vazio
-- Mantém a imutabilidade para todos os outros campos

-- Drop do trigger antigo (CASCADE para remover dependências)
DROP TRIGGER IF EXISTS enforce_laudo_immutability ON laudos;
DROP TRIGGER IF EXISTS trigger_laudo_immutability ON laudos;
DROP FUNCTION IF EXISTS check_laudo_immutability() CASCADE;

-- Nova função que permite atualização apenas do hash_pdf quando está NULL
CREATE OR REPLACE FUNCTION check_laudo_immutability()
RETURNS TRIGGER AS $$
BEGIN
  -- Permitir INSERT sempre
  IF (TG_OP = 'INSERT') THEN
    RETURN NEW;
  END IF;

  -- Para UPDATE, verificar se o laudo foi emitido
  IF (TG_OP = 'UPDATE' AND OLD.emitido_em IS NOT NULL) THEN
    -- Permitir atualização APENAS do hash_pdf quando está NULL ou vazio
    -- E apenas se nenhum outro campo foi alterado
    IF (OLD.hash_pdf IS NULL OR OLD.hash_pdf = '') AND
       (NEW.hash_pdf IS NOT NULL AND NEW.hash_pdf != '') AND
       -- Verificar que NENHUM outro campo mudou
       OLD.lote_id = NEW.lote_id AND
       OLD.emissor_cpf = NEW.emissor_cpf AND
       OLD.status = NEW.status AND
       OLD.observacoes = NEW.observacoes AND
       (OLD.emitido_em = NEW.emitido_em OR (OLD.emitido_em IS NULL AND NEW.emitido_em IS NULL)) AND
       (OLD.enviado_em = NEW.enviado_em OR (OLD.enviado_em IS NULL AND NEW.enviado_em IS NULL)) THEN
      -- Permitir apenas esta atualização específica
      RETURN NEW;
    END IF;

    -- Qualquer outra tentativa de modificação é bloqueada
    RAISE EXCEPTION 'Não é permitido modificar laudos já emitidos. Laudo ID: %', OLD.id
      USING HINT = 'Laudos emitidos são imutáveis para garantir integridade documental.';
  END IF;

  -- DELETE não é permitido para laudos emitidos
  IF (TG_OP = 'DELETE' AND OLD.emitido_em IS NOT NULL) THEN
    RAISE EXCEPTION 'Não é permitido deletar laudos já emitidos. Laudo ID: %', OLD.id
      USING HINT = 'Laudos emitidos são imutáveis para garantir integridade documental.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
CREATE TRIGGER enforce_laudo_immutability
  BEFORE UPDATE OR DELETE ON laudos
  FOR EACH ROW
  EXECUTE FUNCTION check_laudo_immutability();

-- Comentário para documentação
COMMENT ON FUNCTION check_laudo_immutability() IS 
'Garante imutabilidade de laudos emitidos, exceto para backfill do hash_pdf quando NULL';
