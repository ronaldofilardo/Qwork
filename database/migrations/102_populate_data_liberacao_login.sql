-- Migration: Popular coluna data_liberacao_login corretamente para registros ativos
-- Data: 2026-01-23
-- Descrição: Corrige tentativa anterior que usava coluna inexistente `created_at`.

UPDATE entidades
SET data_liberacao_login = COALESCE(data_liberacao_login, aprovado_em, criado_em)
WHERE ativa = TRUE
  AND data_liberacao_login IS NULL;

-- Verificação
SELECT COUNT(*) FILTER (WHERE ativa = TRUE AND data_liberacao_login IS NULL) as ativos_sem_data FROM entidades;