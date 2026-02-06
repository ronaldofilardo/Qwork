-- Migration: Adicionar colunas de metadados de arquivo remoto para laudos
-- Data: 2026-02-06
-- Objetivo: Complementar controle de upload de laudos para Backblaze com metadata completo

-- Adicionar colunas de metadados de arquivo remoto
ALTER TABLE laudos 
    ADD COLUMN IF NOT EXISTS arquivo_remoto_uploaded_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS arquivo_remoto_etag VARCHAR(255),
    ADD COLUMN IF NOT EXISTS arquivo_remoto_size BIGINT;

-- Comentários explicativos
COMMENT ON COLUMN laudos.arquivo_remoto_uploaded_at IS 
    'Timestamp de quando o laudo foi feito upload para o storage remoto (Backblaze)';

COMMENT ON COLUMN laudos.arquivo_remoto_etag IS 
    'ETag retornado pelo storage remoto para verificação de integridade';

COMMENT ON COLUMN laudos.arquivo_remoto_size IS 
    'Tamanho do arquivo em bytes no storage remoto';

-- Criar índice para consultas por status de sincronização
CREATE INDEX IF NOT EXISTS idx_laudos_arquivo_remoto_sync 
    ON laudos(arquivo_remoto_key, arquivo_remoto_uploaded_at) 
    WHERE arquivo_remoto_key IS NOT NULL;

-- Comentário no índice
COMMENT ON INDEX idx_laudos_arquivo_remoto_sync IS 
    'Índice para consultas de laudos sincronizados com storage remoto';