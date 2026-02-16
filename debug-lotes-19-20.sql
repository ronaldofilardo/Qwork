-- ============================================================================
-- DEBUG: Verificar estado atual dos lotes 19 e 20 no banco Neon
-- Execute este script no console do Neon para diagnóstico
-- ============================================================================

-- 1. Estado completo dos laudos 19 e 20
SELECT 
  '=== ESTADO ATUAL ===' as etapa,
  l.id as laudo_id,
  l.lote_id,
  l.status,
  l.hash_pdf IS NOT NULL as tem_hash_pdf,
  LEFT(l.hash_pdf, 20) || '...' as hash_preview,
  l.emitido_em,
  l.arquivo_remoto_url IS NOT NULL as tem_url_bucket,
  l.criado_em,
  l.atualizado_em,
  
  -- Diagnóstico
  CASE 
    WHEN l.status = 'emitido' AND l.hash_pdf IS NOT NULL AND l.emitido_em IS NOT NULL THEN 
      '✅ Estado CORRETO - Pronto para enviar ao bucket'
    WHEN l.status = 'rascunho' AND l.hash_pdf IS NOT NULL THEN 
      '❌ BUG - Tem PDF mas status rascunho (precisa UPDATE)'
    WHEN l.status = 'rascunho' AND l.hash_pdf IS NULL THEN 
      '⚪ Aguardando geração do PDF'
    ELSE '⚠️ Estado inesperado'
  END as diagnostico
FROM laudos l
WHERE l.lote_id IN (19, 20)
ORDER BY l.lote_id;

-- 2. Simular cálculo do backend (flag _emitido)
SELECT 
  '=== SIMULAÇÃO BACKEND ===' as etapa,
  la.id as lote_id,
  l.id as laudo_id,
  l.status as status_laudo,
  (l.status IN ('emitido', 'enviado')) as flag_emitido_backend,
  
  -- O que o frontend vê
  CASE 
    WHEN (l.status IN ('emitido', 'enviado')) THEN 
      '✅ Backend retorna _emitido=TRUE → Aba "Laudo Emitido"'
    ELSE 
      '❌ Backend retorna _emitido=FALSE → Aba "Laudo para Emitir"'
  END as comportamento_frontend
FROM lotes_avaliacao la
LEFT JOIN laudos l ON l.lote_id = la.id
WHERE la.id IN (19, 20)
ORDER BY la.id;

-- 3. Verificar se o UPDATE foi executado
SELECT 
  '=== HISTÓRICO DE UPDATES ===' as etapa,
  lote_id,
  status,
  emitido_em,
  atualizado_em,
  CASE 
    WHEN atualizado_em > (NOW() - INTERVAL '10 minutes') THEN 
      '🕐 Atualizado recentemente (últimos 10 min)'
    WHEN atualizado_em > (NOW() - INTERVAL '1 hour') THEN 
      '🕑 Atualizado na última hora'
    ELSE 
      '⏰ Não foi atualizado recentemente'
  END as timing
FROM laudos
WHERE lote_id IN (19, 20);

-- ============================================================================
-- DIAGNÓSTICO:
-- ============================================================================
-- Se status='rascunho': ❌ SQL de correção NÃO foi executado
-- Se status='emitido': ✅ SQL executado, mas servidor pode não ter reiniciado
-- ============================================================================
