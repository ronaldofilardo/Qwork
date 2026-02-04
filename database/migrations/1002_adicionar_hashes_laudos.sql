-- ============================================================================
-- Migração 1002: Adicionar hash aos laudos com PDF disponível
-- Data: 2026-01-30
-- ============================================================================

-- CONTEXTO:
-- - 7 laudos emitidos sem hash_pdf (violação da imutabilidade)
-- - 4 laudos têm PDF local (5, 7, 8, 9) → gerar hash
-- - 3 laudos sem PDF (2, 3, 4, 6, 10, 11, 13) → marcar observação

-- ============================================================================
-- PARTE 1: Atualizar hashes dos PDFs existentes
-- ============================================================================
-- ATENÇÃO: Execute o script Node.js primeiro para gerar os hashes:
-- > node scripts/gerar-hash-laudos-faltantes.js
--
-- Depois execute os UPDATEs abaixo com os hashes gerados

-- Laudo 5 (laudo-5.pdf)
-- UPDATE laudos 
-- SET hash_pdf = '<HASH_GERADO>', 
--     atualizado_em = NOW()
-- WHERE id = 5 AND hash_pdf IS NULL;

-- Laudo 7 (laudo-7.pdf) 
-- UPDATE laudos
-- SET hash_pdf = '<HASH_GERADO>',
--     atualizado_em = NOW()
-- WHERE id = 7 AND hash_pdf IS NULL;

-- Laudo 8 (laudo-8.pdf)
-- UPDATE laudos
-- SET hash_pdf = '<HASH_GERADO>',
--     atualizado_em = NOW()
-- WHERE id = 8 AND hash_pdf IS NULL;

-- Laudo 9 (laudo-9.pdf)
-- UPDATE laudos
-- SET hash_pdf = '<HASH_GERADO>',
--     atualizado_em = NOW()
-- WHERE id = 9 AND hash_pdf IS NULL;

-- ============================================================================
-- PARTE 2: Marcar laudos sem PDF como necessitando atenção
-- ============================================================================

UPDATE laudos
SET observacoes = COALESCE(observacoes || E'\n\n', '') || 
  '⚠️ PDF ORIGINAL PERDIDO - Hash não pôde ser gerado no momento da emissão. ' ||
  'Laudo permanece válido conforme auditoria de ' || TO_CHAR(NOW(), 'DD/MM/YYYY') || '. ' ||
  'Para regeneração futura, contactar administrador do sistema.'
WHERE id IN (2, 3, 4, 6, 10, 11, 13)
  AND hash_pdf IS NULL;

-- ============================================================================
-- RELATÓRIO: Estado atual dos hashes
-- ============================================================================

SELECT 
  '========================================' as linha,
  'RELATÓRIO DE HASHES - LAUDOS EMITIDOS' as titulo;

SELECT 
  l.idas lote_codigo,
  l.status,
  l.emitido_em::date as data_emissao,
  CASE 
    WHEN l.hash_pdf IS NOT NULL THEN '✓ COM HASH'
    WHEN l.id IN (5, 7, 8, 9) THEN '⚠️ PDF LOCAL (executar script)'
    ELSE '❌ PDF PERDIDO'
  END as status_hash,
  CASE 
    WHEN l.hash_pdf IS NOT NULL THEN LEFT(l.hash_pdf, 16) || '...'
    ELSE NULL
  END as hash_preview
FROM laudos l
LEFT JOIN lotes_avaliacao la ON la.id = l.lote_id
WHERE l.status IN ('emitido', 'enviado')
ORDER BY 
  CASE 
    WHEN l.hash_pdf IS NULL THEN 0
    ELSE 1
  END,
  l.id;
