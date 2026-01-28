-- Migration: Remover colunas binárias de laudos
-- Executar APÓS executar e validar o script de backfill (scripts/backfill/laudos-backfill.ts)

-- Backup das colunas (opcional)
-- ALTER TABLE laudos ADD COLUMN arquivo_pdf_backup bytea;
-- UPDATE laudos SET arquivo_pdf_backup = arquivo_pdf;

BEGIN;

-- Remover colunas de arquivo e hash (se existirem)
ALTER TABLE laudos DROP COLUMN IF EXISTS arquivo_pdf;
ALTER TABLE laudos DROP COLUMN IF EXISTS hash_pdf;

COMMIT;

-- NOTE: manter cópia do backup em lugar seguro antes de remover permanentemente.
