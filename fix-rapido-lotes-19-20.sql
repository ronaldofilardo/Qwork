-- ============================================================================
-- CORREÇÃO FINAL: Sincronizar lotes 19 e 20 com arquivos locais
-- ============================================================================
-- Este script corrige a inconsistência onde:
-- • PDFs foram gerados localmente (laudo-19.pdf, laudo-20.pdf existem)
-- • Hashes foram salvos no banco
-- • MAS status permaneceu como 'rascunho' ao invés de 'emitido'
--
-- CAUSA RAIZ: Bug na função gerarLaudoCompletoEmitirPDF() que foi corrigido
--              A correção no código evitará novos casos, mas lotes 19 e 20 
--              precisam de correção manual no banco.
-- ============================================================================

-- PASSO 1: Verificar estado ANTES da correção
SELECT 
  lote_id, 
  status, 
  hash_pdf IS NOT NULL as tem_hash,
  emitido_em,
  arquivo_remoto_url IS NOT NULL as no_bucket,
  CASE 
    WHEN status = 'emitido' THEN '✅ Correto'
    WHEN status = 'rascunho' AND hash_pdf IS NOT NULL THEN '❌ Deve ser emitido'
    ELSE '⚠️ Verificar'
  END as diagnostico
FROM laudos 
WHERE lote_id IN (19, 20);

-- PASSO 2: Executar correção
UPDATE laudos
SET 
  status = 'emitido',
  emitido_em = NOW(),
  atualizado_em = NOW()
WHERE 
  lote_id IN (19, 20)
  AND status = 'rascunho'
  AND hash_pdf IS NOT NULL;

-- Deve retornar: UPDATE 2

-- PASSO 3: Verificar estado DEPOIS da correção
SELECT 
  lote_id, 
  status, 
  hash_pdf IS NOT NULL as tem_hash, 
  emitido_em,
  arquivo_remoto_url IS NOT NULL as no_bucket,
  CASE 
    WHEN status = 'emitido' AND hash_pdf IS NOT NULL THEN '✅ CORRIGIDO!'
    ELSE '⚠️ Verificar'
  END as validacao
FROM laudos 
WHERE lote_id IN (19, 20);

-- ============================================================================
-- PÓS-CORREÇÃO:
-- ============================================================================
-- 1. ✅ Código corrigido em lib/laudo-auto.ts
-- 2. ✅ Banco atualizado para lotes 19 e 20
-- 3. ⏳ PRÓXIMO PASSO: Reiniciar servidor Next.js
--    • Terminal: Ctrl+C
--    • Comando: pnpm dev
-- 4. ⏳ Atualizar navegador (F5) na página /emissor
-- 5. ⏳ Verificar:
--    • Lotes 19 e 20 devem aparecer na aba "Laudo Emitido"
--    • Botão verde "Enviar ao Bucket" deve aparecer
--    • Botão "Reprocessar" NÃO deve aparecer
-- ============================================================================
