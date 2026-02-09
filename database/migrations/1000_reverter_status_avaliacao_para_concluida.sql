-- Migration: Reverter status de avaliações para 'concluida' (feminino)
-- Data: 2026-02-08
-- Descrição: Reverte mudança incorreta da migração 999. O correto é usar 'concluida' 
--            (feminino) para avaliações, seguindo o gênero da palavra "avaliação".
--            Lotes usam 'concluido' (masculino) pois é "lote concluído".

-- IMPORTANTE: Esta migração corrige a inconsistência entre banco e código.
-- O código foi atualizado para reconhecer AMBOS os valores para retrocompatibilidade.

DO $$ 
BEGIN
  -- Verificar se 'concluido' existe no enum e 'concluida' não existe
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'status_avaliacao'::regtype 
    AND enumlabel = 'concluido'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'status_avaliacao'::regtype 
    AND enumlabel = 'concluida'
  ) THEN
    -- Renomear 'concluido' para 'concluida' no enum
    ALTER TYPE status_avaliacao RENAME VALUE 'concluido' TO 'concluida';
    RAISE NOTICE 'Enum status_avaliacao: valor "concluido" renomeado para "concluida"';
  ELSIF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'status_avaliacao'::regtype 
    AND enumlabel = 'concluida'
  ) THEN
    RAISE NOTICE 'Enum status_avaliacao já contém "concluida" - migração já aplicada';
  ELSE
    RAISE EXCEPTION 'Estado inesperado do enum status_avaliacao - verificar manualmente';
  END IF;
END $$;

-- Atualizar dados existentes: converter 'concluido' → 'concluida' nas avaliações
UPDATE avaliacoes 
SET status = 'concluida' 
WHERE status = 'concluido';

-- Atualizar constraint para aceitar AMBOS os valores (retrocompatibilidade)
ALTER TABLE avaliacoes DROP CONSTRAINT IF EXISTS avaliacoes_status_check;
ALTER TABLE avaliacoes ADD CONSTRAINT avaliacoes_status_check 
  CHECK (status IN ('rascunho', 'iniciada', 'em_andamento', 'concluida', 'concluido', 'inativada'));

-- Atualizar comentário do tipo (linha única para evitar problemas de concatenação)
COMMENT ON TYPE status_avaliacao IS 'Status de avaliações: iniciada, em_andamento, concluida (feminino), inativada. Constraint aceita também concluido (retrocompatibilidade).';

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migração 1000 concluída: status_avaliacao usa "concluida" (feminino)';
  RAISE NOTICE '📝 Constraint atualizada para aceitar ambos "concluida" e "concluido"';
END $$;
