-- Migration: Padronização do status 'concluido' para avaliações
-- Data: 2026-02-05
-- Descrição: Padroniza o uso de 'concluido' (sem acento) em todo o sistema

-- Atualizar enum para usar 'concluido'
-- (Executado via SQL direto: ALTER TYPE status_avaliacao RENAME VALUE 'concluida' TO 'concluido';)

-- Atualizar constraint
-- (Executado via SQL direto: ALTER TABLE avaliacoes DROP CONSTRAINT IF EXISTS avaliacoes_status_check; 
--  ALTER TABLE avaliacoes ADD CONSTRAINT avaliacoes_status_check CHECK (status IN ('rascunho', 'iniciada', 'em_andamento', 'concluido', 'inativada'));)

-- Atualizar comentário
COMMENT ON TYPE status_avaliacao IS 'Status de avaliações: iniciada (criada/não iniciada), em_andamento (respondendo), concluido (finalizada), inativada (cancelada). Nota: liberada é obsoleto.';

-- Nota: Dados existentes já foram convertidos de 'concluida' para 'concluido' se necessário