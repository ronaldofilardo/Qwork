-- Migration 1014: Remove trigger e function de auditoria com estrutura incorreta
-- O trigger tentava inserir em colunas que não existem na tabela auditoria_geral

BEGIN;

-- Remover trigger se existir
DROP TRIGGER IF EXISTS trigger_auditoria_confirmacao_identidade ON confirmacao_identidade;

-- Remover function se existir
DROP FUNCTION IF EXISTS registrar_auditoria_confirmacao_identidade();

COMMIT;
