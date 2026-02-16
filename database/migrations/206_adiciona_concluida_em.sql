-- Migração: Adiciona coluna concluida_em na tabela avaliacoes
-- Data: 2026-02-16
-- Motivo: Registrar timestamp exato da conclusão da avaliação nos relatórios

BEGIN;

-- Adicionar coluna concluida_em se não existir
ALTER TABLE avaliacoes
  ADD COLUMN IF NOT EXISTS concluida_em TIMESTAMP;

-- Atualizar avaliações que já estão concluídas mas não têm concluida_em
UPDATE avaliacoes
SET concluida_em = COALESCE(concluida_em, envio, atualizado_em)
WHERE status = 'concluida' AND concluida_em IS NULL;

-- Criar índice para melhor performance em buscas de data de conclusão
CREATE INDEX IF NOT EXISTS idx_avaliacoes_concluida_em 
ON avaliacoes(concluida_em) 
WHERE concluida_em IS NOT NULL;

COMMIT;
