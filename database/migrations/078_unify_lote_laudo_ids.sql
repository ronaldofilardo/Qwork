-- Migração: Unificação de IDs entre lotes e laudos (lote.id = laudo.id)
-- Data: 2026-01-28
-- Objetivo: Garantir que laudos sempre tenham id = lote_id para eliminar bugs de sincronização
-- 
-- Premissas confirmadas:
-- - Relação 1:1 estrita entre lote e laudo
-- - Laudos são imutáveis (possuem hash criptográfico)
-- - Banco está limpo de dados históricos
-- - Nenhum histórico/versionamento necessário

BEGIN;

-- 1. Garantir que todos os laudos existentes tenham lote_id = id
-- (Se o banco está limpo, esta query não afetará nenhuma linha, mas é uma garantia)
UPDATE laudos SET lote_id = id WHERE lote_id != id;

-- 2. Adicionar constraint de unicidade em lote_id (se não existir)
-- Isso garante a relação 1:1
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'laudos_lote_id_unique'
    ) THEN
        ALTER TABLE laudos ADD CONSTRAINT laudos_lote_id_unique UNIQUE (lote_id);
    END IF;
END $$;

-- 3. Adicionar constraint de igualdade (id = lote_id)
-- Esta é a constraint central que garante a unificação
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'laudos_id_equals_lote_id'
    ) THEN
        ALTER TABLE laudos ADD CONSTRAINT laudos_id_equals_lote_id CHECK (id = lote_id);
    END IF;
END $$;

-- 4. Adicionar índice composto otimizado (opcional, mas recomendado)
-- Melhora performance de queries que buscam por id ou lote_id
CREATE INDEX IF NOT EXISTS idx_laudos_id_lote_id ON laudos (id, lote_id);

-- 5. Adicionar comentário explicativo na tabela
COMMENT ON CONSTRAINT laudos_id_equals_lote_id ON laudos IS 
'Garante que id = lote_id. Relação 1:1 estrita: um lote tem exatamente um laudo com o mesmo ID.';

COMMIT;

-- Rollback (se necessário):
-- BEGIN;
-- ALTER TABLE laudos DROP CONSTRAINT IF EXISTS laudos_id_equals_lote_id;
-- DROP INDEX IF EXISTS idx_laudos_id_lote_id;
-- COMMIT;
