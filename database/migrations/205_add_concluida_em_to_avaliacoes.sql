-- Migração: Adiciona coluna concluida_em na tabela avaliacoes (evita erros de testes)
-- Data: 2026-01-28

BEGIN;

ALTER TABLE avaliacoes
  ADD COLUMN IF NOT EXISTS concluida_em TIMESTAMP;

COMMIT;
