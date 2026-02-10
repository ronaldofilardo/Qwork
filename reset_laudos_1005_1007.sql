-- Reset laudos 1005 e 1007 para aguardar upload manual ao bucket
-- Remove metadados de arquivo_remoto_* mas mantém hash_pdf e status='emitido'
-- O emissor deverá usar /api/emissor/laudos/[loteId]/upload para enviar ao bucket

UPDATE laudos
SET 
  arquivo_remoto_provider = NULL,
  arquivo_remoto_bucket = NULL,
  arquivo_remoto_key = NULL,
  arquivo_remoto_url = NULL,
  arquivo_remoto_uploaded_at = NULL,
  arquivo_remoto_size = NULL,
  atualizado_em = NOW()
WHERE id IN (1005, 1007)
  AND status = 'emitido';

-- Verificar resultado
SELECT 
  id,
  lote_id,
  status,
  hash_pdf,
  emitido_em,
  arquivo_remoto_key,
  arquivo_remoto_url,
  atualizado_em
FROM laudos
WHERE id IN (1005, 1007);
