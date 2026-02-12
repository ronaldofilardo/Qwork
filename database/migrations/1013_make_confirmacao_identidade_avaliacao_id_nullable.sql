-- Migration 1013: Make confirmacao_identidade.avaliacao_id nullable for login context
-- Permite que a confirmação de identidade seja registrada no contexto de login sem estar associada a uma avaliação específica

BEGIN;

-- Remove constraint se existir
ALTER TABLE confirmacao_identidade
DROP CONSTRAINT IF EXISTS confirmacao_identidade_avaliacao_id_fkey;

-- Altera coluna para permitir NULL
ALTER TABLE confirmacao_identidade
ALTER COLUMN avaliacao_id DROP NOT NULL;

-- Recriar constraint com ação apropriada para NULL (permitir NULL mantém integridade)
ALTER TABLE confirmacao_identidade
ADD CONSTRAINT confirmacao_identidade_avaliacao_id_fkey 
FOREIGN KEY (avaliacao_id) 
REFERENCES avaliacoes(id) 
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- Comentário para documentação
COMMENT ON COLUMN confirmacao_identidade.avaliacao_id IS 'Foreign key para avaliacoes. Pode ser NULL para confirmações de identidade feitas no contexto de login.';

COMMIT;
