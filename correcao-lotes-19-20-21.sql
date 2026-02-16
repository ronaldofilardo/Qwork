-- ============================================================================
-- CORREÇÃO: SINCRONIZAR LOTES 19, 20 e 21 COM ARQUIVOS LOCAIS
-- Executar no Neon após validar com diagnostico-lotes-19-20-21.sql
-- ============================================================================

BEGIN;

-- PASSO 1: Verificar estado ANTES da correção
-- ============================================================================
SELECT 
  '=== ESTADO ANTES DA CORREÇÃO ===' as etapa,
  l.lote_id,
  l.status as status_atual,
  l.hash_pdf IS NOT NULL as tem_hash,
  l.emitido_em,
  l.arquivo_remoto_url IS NOT NULL as no_bucket
FROM laudos l
WHERE l.lote_id IN (19, 20, 21)
ORDER BY l.lote_id;


-- PASSO 2: CORREÇÃO - Atualizar status dos lotes 19 e 20
-- ============================================================================
-- Esses lotes têm PDF gerado localmente mas status='rascunho' no banco
-- Correção: Atualizar para status='emitido'

UPDATE laudos
SET 
  status = 'emitido',
  emitido_em = NOW(),
  atualizado_em = NOW()
WHERE 
  lote_id IN (19, 20)
  AND status = 'rascunho'
  AND hash_pdf IS NOT NULL
  AND arquivo_remoto_url IS NULL;

-- Verificar quantos registros foram atualizados
-- Esperado: 2 registros (lotes 19 e 20)


-- PASSO 3: Verificar estado DEPOIS da correção
-- ============================================================================
SELECT 
  '=== ESTADO DEPOIS DA CORREÇÃO ===' as etapa,
  l.lote_id,
  l.status as status_corrigido,
  l.hash_pdf IS NOT NULL as tem_hash,
  l.emitido_em,
  l.arquivo_remoto_url IS NOT NULL as no_bucket,
  
  -- Validação final
  CASE 
    WHEN l.lote_id IN (19, 20) AND l.status = 'emitido' AND l.hash_pdf IS NOT NULL THEN 
      '✅ CORRIGIDO - Pronto para enviar ao bucket'
    WHEN l.lote_id = 21 AND l.status = 'rascunho' AND l.hash_pdf IS NULL THEN 
      '✅ CORRETO - Aguardando geração do PDF'
    ELSE '⚠️ REQUER ATENÇÃO'
  END as validacao_final

FROM laudos l
WHERE l.lote_id IN (19, 20, 21)
ORDER BY l.lote_id;


-- PASSO 4: Validação adicional - Verificar hashes
-- ============================================================================
SELECT 
  '=== VALIDAÇÃO DE HASHES ===' as etapa,
  lote_id,
  LEFT(hash_pdf, 16) || '...' as hash_prefix,
  LENGTH(hash_pdf) as hash_length,
  CASE 
    WHEN lote_id = 19 AND hash_pdf = 'd1463831618f3d5718e6fa50e13f69f72f76b61827b0b2b1d3b5cd9f13a1ccbb' 
      THEN '✅ Hash válido (laudo-19.pdf)'
    WHEN lote_id = 20 AND hash_pdf = 'acde4a952fbe17f3cff7e7085303648a17f29041cf60cbb91d11861abcc14488' 
      THEN '✅ Hash válido (laudo-20.pdf)'
    WHEN lote_id = 21 AND hash_pdf IS NULL 
      THEN '✅ Sem hash (PDF não gerado)'
    ELSE '⚠️ Hash não corresponde ao arquivo local'
  END as validacao_hash
FROM laudos
WHERE lote_id IN (19, 20, 21);


-- PASSO 5: Testar query usada pelo backend (/api/emissor/lotes)
-- ============================================================================
-- Esta é a query que o backend usa para determinar se mostra o botão "Enviar ao Bucket"
SELECT 
  '=== TESTE API EMISSOR ===' as etapa,
  la.id as lote_id,
  l.id as laudo_id,
  l.status,
  l.hash_pdf IS NOT NULL as tem_pdf,
  l.arquivo_remoto_url IS NOT NULL as no_bucket,
  (l.status IN ('emitido', 'enviado')) as flag_emitido,
  
  -- Resultado esperado no frontend
  CASE 
    WHEN l.status IN ('emitido', 'enviado') AND l.arquivo_remoto_url IS NULL THEN 
      '🟢 Botão "Enviar ao Bucket" deve aparecer'
    WHEN l.arquivo_remoto_url IS NOT NULL THEN 
      '✅ Botão não aparece (já enviado)'
    WHEN l.status = 'rascunho' AND l.hash_pdf IS NULL THEN 
      '⚪ Botão não aparece (PDF não gerado)'
    ELSE '⚠️ Estado inesperado'
  END as comportamento_esperado_emissor

FROM lotes_avaliacao la
LEFT JOIN laudos l ON l.lote_id = la.id
WHERE la.id IN (19, 20, 21)
ORDER BY la.id;


-- PASSO 6: Testar query usada pelo solicitante (/api/rh/laudos e /api/entidade/lotes)
-- ============================================================================
SELECT 
  '=== TESTE API SOLICITANTE ===' as etapa,
  la.id as lote_id,
  l.id as laudo_id,
  l.status,
  l.arquivo_remoto_url IS NOT NULL as esta_no_bucket,
  
  -- Resultado esperado no card do solicitante
  CASE 
    WHEN l.arquivo_remoto_url IS NOT NULL THEN 
      '📄 Card: "Laudo disponível" (com botão Ver Laudo)'
    WHEN l.arquivo_remoto_url IS NULL THEN 
      '📋 Card: "Emissão Solicitada" (sem botão)'
    ELSE '⚠️ Estado indefinido'
  END as comportamento_esperado_solicitante

FROM lotes_avaliacao la
LEFT JOIN laudos l ON l.lote_id = la.id
WHERE la.id IN (19, 20, 21)
ORDER BY la.id;


-- ============================================================================
-- DECISÃO FINAL
-- ============================================================================
-- Se todas as validações acima estiverem OK (✅), execute:
-- COMMIT;

-- Se houver algum problema (⚠️), execute:
-- ROLLBACK;

-- ============================================================================
-- VERIFICAÇÃO FINAL:
-- ============================================================================
-- ✅ Lote 19: status='emitido', tem hash, sem bucket → Pronto para upload
-- ✅ Lote 20: status='emitido', tem hash, sem bucket → Pronto para upload
-- ✅ Lote 21: status='rascunho', sem hash, sem bucket → Aguardando geração

-- IMPORTANTE: Após COMMIT, você deve:
-- 1. Reiniciar o servidor Next.js (Ctrl+C e rerun)
-- 2. Atualizar a página do emissor (F5)
-- 3. Verificar se os botões "Enviar ao Bucket" aparecem para lotes 19 e 20
-- 4. Verificar se o lote 21 continua sem botão (correto)
-- 5. Verificar se o solicitante vê "Emissão Solicitada" para todos os 3 lotes
