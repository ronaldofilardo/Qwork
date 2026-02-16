-- =========================================================
-- CORREÇÃO DEFINITIVA: Lotes 19 e 20
-- Status: rascunho → emitido (PDFs foram gerados)
-- =========================================================

-- ANTES: Verificar estado atual
SELECT 
  l.lote_id,
  l.status as status_antes,
  l.emitido_em as emitido_antes,
  l.hash_pdf IS NOT NULL as tem_pdf,
  l.arquivo_remoto_url IS NOT NULL as no_bucket
FROM laudos l
WHERE l.lote_id IN (19, 20)
ORDER BY l.lote_id;

-- CORREÇÃO: Atualizar status para 'emitido' e preencher timestamp
BEGIN;

UPDATE laudos
SET 
  status = 'emitido',
  emitido_em = NOW()
WHERE lote_id IN (19, 20)
  AND status = 'rascunho'
  AND hash_pdf IS NOT NULL;

-- DEPOIS: Verificar resultado
SELECT 
  l.lote_id,
  l.status as status_depois,
  l.emitido_em as emitido_depois,
  CASE 
    WHEN l.status = 'emitido' THEN '✅ Corrigido'
    ELSE '❌ Ainda errado'
  END as resultado,
  -- Análise para EMISSOR
  CASE 
    WHEN l.status IN ('emitido', 'enviado') 
    THEN '✅ Botão "Enviar ao Bucket" vai aparecer'
    ELSE '❌ Botão não vai aparecer'
  END as emissor_botao
FROM laudos l
WHERE l.lote_id IN (19, 20)
ORDER BY l.lote_id;

-- Se tudo estiver correto, confirmar:
COMMIT;

-- Se houver problema, reverter:
-- ROLLBACK;
