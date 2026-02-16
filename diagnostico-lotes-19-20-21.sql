-- ============================================================================
-- DIAGNÓSTICO COMPLETO: LOTES 19, 20 e 21
-- Objetivo: Sincronizar estado no Neon com arquivos locais
-- ============================================================================

-- 1. VERIFICAR ESTADO ATUAL DOS LAUDOS NO BANCO
-- ============================================================================
SELECT 
  l.id as laudo_id,
  l.lote_id,
  l.status,
  l.hash_pdf,
  LENGTH(l.hash_pdf) as hash_length,
  l.arquivo_remoto_provider,
  l.arquivo_remoto_bucket,
  l.arquivo_remoto_key,
  l.arquivo_remoto_url,
  l.emitido_em,
  l.arquivo_remoto_uploaded_at,
  l.criado_em,
  l.atualizado_em,
  
  -- Flags de diagnóstico
  CASE 
    WHEN l.hash_pdf IS NOT NULL THEN '✅ PDF gerado localmente'
    ELSE '❌ PDF não gerado'
  END as status_pdf_local,
  
  CASE 
    WHEN l.arquivo_remoto_url IS NOT NULL THEN '✅ Enviado ao bucket'
    ELSE '❌ Não enviado ao bucket'
  END as status_bucket,
  
  CASE 
    WHEN l.status = 'emitido' THEN '✅ Status correto (emitido)'
    WHEN l.status = 'rascunho' AND l.hash_pdf IS NOT NULL THEN '⚠️ Status errado (deveria ser emitido)'
    WHEN l.status = 'rascunho' AND l.hash_pdf IS NULL THEN '✅ Status correto (rascunho)'
    ELSE '⚠️ Status desconhecido'
  END as analise_status,
  
  -- Ação necessária
  CASE 
    WHEN l.hash_pdf IS NOT NULL AND l.status = 'rascunho' THEN 
      '🔧 CORRIGIR: Atualizar status para emitido'
    WHEN l.hash_pdf IS NULL AND l.status = 'rascunho' THEN 
      '✅ OK: Aguardando geração do PDF'
    WHEN l.hash_pdf IS NOT NULL AND l.status = 'emitido' AND l.arquivo_remoto_url IS NULL THEN
      '✅ OK: Pronto para enviar ao bucket'
    WHEN l.arquivo_remoto_url IS NOT NULL THEN
      '✅ OK: Totalmente sincronizado'
    ELSE '⚠️ Verificar manualmente'
  END as acao_necessaria

FROM laudos l
WHERE l.lote_id IN (19, 20, 21)
ORDER BY l.lote_id;


-- 2. HASHES ESPERADOS (baseado nos arquivos locais)
-- ============================================================================
-- Lote 19: d1463831618f3d5718e6fa50e13f69f72f76b61827b0b2b1d3b5cd9f13a1ccbb (SHA-256)
-- Lote 20: acde4a952fbe17f3cff7e7085303648a17f29041cf60cbb91d11861abcc14488 (SHA-256)
-- Lote 21: (não gerado ainda)

SELECT 
  lote_id,
  hash_pdf,
  CASE 
    WHEN lote_id = 19 AND hash_pdf = 'd1463831618f3d5718e6fa50e13f69f72f76b61827b0b2b1d3b5cd9f13a1ccbb' 
      THEN '✅ Hash correto'
    WHEN lote_id = 20 AND hash_pdf = 'acde4a952fbe17f3cff7e7085303648a17f29041cf60cbb91d11861abcc14488' 
      THEN '✅ Hash correto'
    WHEN lote_id = 21 AND hash_pdf IS NULL 
      THEN '✅ Hash correto (não gerado)'
    ELSE '⚠️ Hash diferente do arquivo local'
  END as validacao_hash
FROM laudos
WHERE lote_id IN (19, 20, 21);


-- 3. VERIFICAR LOTES (tabela lotes_avaliacao)
-- ============================================================================
SELECT 
  la.id as lote_id,
  la.status as lote_status,
  la.empresa_cliente_id,
  la.clinica_origem_id,
  la.data_recebimento,
  la.criado_em,
  
  -- Contagem de avaliações
  (SELECT COUNT(*) FROM avaliacoes_clinicas ac WHERE ac.lote_id = la.id) as total_avaliacoes,
  (SELECT COUNT(*) FROM avaliacoes_clinicas ac WHERE ac.lote_id = la.id AND ac.status = 'concluida') as avaliacoes_concluidas,
  
  -- Status esperado
  CASE 
    WHEN la.status = 'concluido' THEN '✅ Lote concluído'
    ELSE '⚠️ Lote ainda não concluído'
  END as analise_lote

FROM lotes_avaliacao la
WHERE la.id IN (19, 20, 21)
ORDER BY la.id;


-- 4. RESUMO EXECUTIVO: O QUE PRECISA SER CORRIGIDO
-- ============================================================================
SELECT 
  l.lote_id,
  
  -- Estado atual
  l.status as status_atual,
  l.hash_pdf IS NOT NULL as tem_pdf_local,
  l.arquivo_remoto_url IS NOT NULL as esta_no_bucket,
  
  -- Estado esperado
  CASE 
    WHEN l.hash_pdf IS NOT NULL THEN 'emitido'
    ELSE 'rascunho'
  END as status_esperado,
  
  -- Precisa correção?
  CASE 
    WHEN l.hash_pdf IS NOT NULL AND l.status != 'emitido' THEN '🔧 SIM - Atualizar status'
    WHEN l.hash_pdf IS NULL AND l.status = 'rascunho' THEN '✅ NÃO - Está correto'
    ELSE '✅ NÃO - Está correto'
  END as precisa_correcao,
  
  -- Comando SQL de correção
  CASE 
    WHEN l.hash_pdf IS NOT NULL AND l.status != 'emitido' THEN
      'UPDATE laudos SET status = ''emitido'', emitido_em = NOW(), atualizado_em = NOW() WHERE lote_id = ' || l.lote_id || ';'
    ELSE NULL
  END as comando_correcao

FROM laudos l
WHERE l.lote_id IN (19, 20, 21)
ORDER BY l.lote_id;
