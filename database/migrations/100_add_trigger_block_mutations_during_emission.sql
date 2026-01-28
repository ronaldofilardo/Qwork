-- Migration: Block mutations on avaliacoes and lotes during emission window
-- Description: Prevents data changes between lote conclusion and laudo emission (emitido_em)
-- Created: 2026-01-27

-- Function to prevent mutations during emission window
CREATE OR REPLACE FUNCTION prevent_mutation_during_emission()
RETURNS TRIGGER AS $$
DECLARE
  lote_status TEXT;
  lote_emitido_em TIMESTAMP;
  lote_processamento_em TIMESTAMP;
BEGIN
  -- Get lote status and emission timestamp
  SELECT status, emitido_em, processamento_em 
  INTO lote_status, lote_emitido_em, lote_processamento_em
  FROM lotes_avaliacao 
  WHERE id = NEW.lote_id;

  -- Block mutations if lote is 'concluido' but not yet emitted
  IF lote_status = 'concluido' AND lote_emitido_em IS NULL THEN
    RAISE EXCEPTION 'Não é permitido modificar avaliações enquanto o lote está em processo de emissão. Status: %, Lote ID: %', 
      lote_status, NEW.lote_id
    USING ERRCODE = '23503',
          HINT = 'Aguarde a conclusão da emissão do laudo antes de fazer alterações.';
  END IF;

  -- Also block if processamento_em is set (being processed right now)
  IF lote_processamento_em IS NOT NULL THEN
    RAISE EXCEPTION 'Não é permitido modificar avaliações enquanto o lote está sendo processado. Lote ID: %', 
      NEW.lote_id
    USING ERRCODE = '23503',
          HINT = 'O lote está sendo processado neste momento. Aguarde alguns instantes.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on avaliacoes BEFORE UPDATE
DROP TRIGGER IF EXISTS trigger_prevent_avaliacao_mutation_during_emission ON avaliacoes;
CREATE TRIGGER trigger_prevent_avaliacao_mutation_during_emission
  BEFORE UPDATE ON avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_mutation_during_emission();

-- Function to prevent lote mutations during emission
CREATE OR REPLACE FUNCTION prevent_lote_mutation_during_emission()
RETURNS TRIGGER AS $$
BEGIN
  -- Block mutations if lote is 'concluido' but not yet emitted
  IF OLD.status = 'concluido' AND OLD.emitido_em IS NULL THEN
    -- Allow setting emitido_em (emission process completion)
    IF NEW.emitido_em IS NOT NULL AND OLD.emitido_em IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Allow setting processamento_em (start of processing)
    IF NEW.processamento_em IS NOT NULL AND OLD.processamento_em IS NULL THEN
      RETURN NEW;
    END IF;

    -- Allow clearing processamento_em (end of processing)
    IF NEW.processamento_em IS NULL AND OLD.processamento_em IS NOT NULL THEN
      RETURN NEW;
    END IF;

    -- Block any other modifications
    RAISE EXCEPTION 'Não é permitido modificar o lote enquanto está em processo de emissão. Status: concluido, emitido_em: NULL'
    USING ERRCODE = '23503',
          HINT = 'Aguarde a conclusão da emissão do laudo antes de fazer alterações.';
  END IF;

  -- Block if processamento_em is set (except for clearing it or setting emitido_em)
  IF OLD.processamento_em IS NOT NULL THEN
    -- Allow completing emission (setting emitido_em)
    IF NEW.emitido_em IS NOT NULL AND OLD.emitido_em IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Allow clearing processamento_em
    IF NEW.processamento_em IS NULL AND OLD.processamento_em IS NOT NULL THEN
      RETURN NEW;
    END IF;

    -- Block any other modifications
    RAISE EXCEPTION 'Não é permitido modificar o lote enquanto está sendo processado.'
    USING ERRCODE = '23503',
          HINT = 'O lote está sendo processado neste momento. Aguarde alguns instantes.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on lotes_avaliacao BEFORE UPDATE
DROP TRIGGER IF EXISTS trigger_prevent_lote_mutation_during_emission ON lotes_avaliacao;
CREATE TRIGGER trigger_prevent_lote_mutation_during_emission
  BEFORE UPDATE ON lotes_avaliacao
  FOR EACH ROW
  EXECUTE FUNCTION prevent_lote_mutation_during_emission();

-- Add processamento_em column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lotes_avaliacao' AND column_name = 'processamento_em'
  ) THEN
    ALTER TABLE lotes_avaliacao ADD COLUMN processamento_em TIMESTAMP;
    COMMENT ON COLUMN lotes_avaliacao.processamento_em IS 'Timestamp quando o processamento de emissão foi iniciado';
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_processamento_em 
  ON lotes_avaliacao(processamento_em) 
  WHERE processamento_em IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_status_emitido 
  ON lotes_avaliacao(status, emitido_em) 
  WHERE status = 'concluido' AND emitido_em IS NULL;
