-- Correção manual para lote 18 que já foi enviado ao bucket mas não foi registrado no banco
-- EXECUTE APÓS VERIFICAR A URL EXATA NO BACKBLAZE

-- Primeiro, consultar qual é o arquivo enviado para o lote 18 no Backblaze:
-- https://tree-iad1-0004.secure.backblaze.com/b2_browse_files2.htm
-- Navegar para: Baldes > laudos-qwork > laudos > lote-18
-- Copiar o nome completo do arquivo (ex: laudo-1734567890-abc123.pdf)

-- Depois, executar o UPDATE abaixo substituindo [NOME-DO-ARQUIVO] pela URL completa:

BEGIN;

-- Verificar estado atual do lote 18
SELECT 
  l.id as laudo_id,
  l.lote_id,
  l.status,
  l.hash_pdf IS NOT NULL as tem_hash,
  l.arquivo_remoto_key,
  l.arquivo_remoto_url,
  l.emitido_em
FROM laudos l
WHERE l.lote_id = 18;

-- IMPORTANTE: Substitua [NOME-DO-ARQUIVO] pela URL/key correta do Backblaze
-- Exemplo de key: laudos/lote-18/laudo-1734567890-abc123.pdf
-- Exemplo de URL: https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-18/laudo-1734567890-abc123.pdf

UPDATE laudos
SET 
  arquivo_remoto_provider = 'backblaze',
  arquivo_remoto_bucket = 'laudos-qwork',
  arquivo_remoto_key = '[SUBSTITUA-AQUI-PELA-KEY]', -- ex: laudos/lote-18/laudo-1734567890-abc123.pdf
  arquivo_remoto_url = '[SUBSTITUA-AQUI-PELA-URL-COMPLETA]', -- ex: https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-18/laudo-1734567890-abc123.pdf
  arquivo_remoto_uploaded_at = NOW(),
  arquivo_remoto_size = (SELECT pg_column_size(hash_pdf) FROM laudos WHERE lote_id = 18),
  status = 'emitido',
  emitido_em = COALESCE(emitido_em, NOW()),
  atualizado_em = NOW()
WHERE lote_id = 18 
  AND hash_pdf IS NOT NULL 
  AND arquivo_remoto_url IS NULL;

-- Verificar resultado
SELECT 
  l.id as laudo_id,
  l.lote_id,
  l.status,
  l.arquivo_remoto_key,
  l.arquivo_remoto_url,
  l.emitido_em,
  l.arquivo_remoto_uploaded_at
FROM laudos l
WHERE l.lote_id = 18;

-- Se tudo estiver OK, confirme:
-- COMMIT;
-- Caso contrário:
-- ROLLBACK;
