-- Migration 098: Corrigir função prevent_lote_mutation_during_emission que ainda referencia campo removido
-- Data: 31/01/2026
-- Objetivo: Remover referências ao campo processamento_em que foi removido na migration 097

-- Substituir a função com versão que não referencia processamento_em
CREATE OR REPLACE FUNCTION prevent_lote_mutation_during_emission()
RETURNS TRIGGER AS $$
BEGIN
  -- Previne alterações no lote durante a emissão do laudo
  -- NOTA: Campo processamento_em foi removido em migration 097
  -- Esta trigger agora apenas previne alterações críticas de campos principais
  
  -- Se é um INSERT, permitir
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Se é UPDATE, verificar se está tentando mudar campos críticos
  -- durante o processo de emissão (quando já existe laudo)
  IF TG_OP = 'UPDATE' THEN
    -- Verificar se existe laudo emitido para este lote
    IF EXISTS (
      SELECT 1 FROM laudos 
      WHERE lote_id = OLD.id 
      AND status IN ('emitido', 'enviado')
    ) THEN
      -- Se laudo está emitido, prevenir mudanças em campos críticos
      IF OLD.empresa_id IS DISTINCT FROM NEW.empresa_id
         OR OLD.setor_id IS DISTINCT FROM NEW.setor_id
         OR OLD.codigo IS DISTINCT FROM NEW.codigo THEN
        RAISE EXCEPTION 'Não é permitido alterar campos críticos de lote com laudo emitido';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentário explicativo
COMMENT ON FUNCTION prevent_lote_mutation_during_emission IS 
'Previne alterações em campos críticos de lotes que já possuem laudos emitidos. Atualizada em migration 098 para remover referência ao campo processamento_em removido.';
