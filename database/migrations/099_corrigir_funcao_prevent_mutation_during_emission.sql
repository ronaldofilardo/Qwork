-- Migration 099: Corrigir função prevent_mutation_during_emission que ainda referencia campo removido
-- Data: 31/01/2026
-- Objetivo: Remover referências ao campo processamento_em da função usada na tabela avaliacoes

-- Substituir a função com versão que não referencia processamento_em
CREATE OR REPLACE FUNCTION prevent_mutation_during_emission()
RETURNS TRIGGER AS $$
DECLARE
  lote_status TEXT;
  lote_emitido_em TIMESTAMP;
BEGIN
  -- Previne alterações nas avaliações durante a emissão do laudo
  -- NOTA: Campo processamento_em foi removido em migration 097
  
  -- Se é um INSERT, permitir
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Se é UPDATE, verificar se está tentando mudar durante emissão
  IF TG_OP = 'UPDATE' THEN
    -- Buscar informações do lote (SEM processamento_em)
    SELECT status, emitido_em
    INTO lote_status, lote_emitido_em
    FROM lotes_avaliacao 
    WHERE id = NEW.lote_id;

    -- Se o laudo já foi emitido, prevenir mudanças críticas
    IF lote_emitido_em IS NOT NULL THEN
      -- Se está tentando mudar campos críticos, prevenir
      IF OLD.status IS DISTINCT FROM NEW.status
         OR OLD.funcionario_cpf IS DISTINCT FROM NEW.funcionario_cpf
         OR OLD.lote_id IS DISTINCT FROM NEW.lote_id THEN
        RAISE EXCEPTION 'Não é permitido alterar campos críticos de avaliação com laudo já emitido';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentário explicativo
COMMENT ON FUNCTION prevent_mutation_during_emission IS 
'Previne alterações em campos críticos de avaliações quando o laudo do lote já foi emitido. Atualizada em migration 099 para remover referência ao campo processamento_em removido.';
