-- ==========================================
-- SCRIPT DE CORRECCAO EMERGENCIAL: Lote #6
-- Data: 2026-02-08
-- Problema: Lote #6 nao transicionou para 'concluido' apos avaliacao #17 ser concluida
-- Causa: Dessinconia entre codigo TS (usando 'concluido') e banco (esperando 'concluida')
-- =========================================

-- Este script recalcula manualmente o status do Lote #6
-- Após aplicação das correções no código TS, o trigger funcionará automaticamente

BEGIN;

-- 1. Verificar estado atual do Lote #6
SELECT 
  la.id,
  la.status as status_lote,
  COUNT(a.id) as total_avaliacoes,
  COUNT(a.id) FILTER (WHERE a.status = 'concluida') as concluidas,
  COUNT(a.id) FILTER (WHERE a.status = 'inativada') as inativadas,
  COUNT(a.id) FILTER (WHERE a.status != 'rascunho') as liberadas
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON la.id = a.lote_id
WHERE la.id = 6
GROUP BY la.id, la.status;

-- 2. Verificar status individual das avaliações
SELECT 
  id,
  funcionario_cpf,
  status,
  inicio,
  envio,
  inativada_em
FROM avaliacoes
WHERE lote_id = 6
ORDER BY id;

-- 3. Atualizar status do lote para 'concluido' se critério for atendido
-- Critério: (concluidas + inativadas) = liberadas AND concluidas > 0
DO $$
DECLARE
  v_lote_id INTEGER := 6;
  v_liberadas INTEGER;
  v_concluidas INTEGER;
  v_inativadas INTEGER;
BEGIN
  -- Contar avaliacoes
  SELECT
    COUNT(*) FILTER (WHERE status != 'rascunho'),
    COUNT(*) FILTER (WHERE status = 'concluida'),
    COUNT(*) FILTER (WHERE status = 'inativada')
  INTO v_liberadas, v_concluidas, v_inativadas
  FROM avaliacoes
  WHERE lote_id = v_lote_id;

  RAISE NOTICE 'Lote %: liberadas=%, concluidas=%, inativadas=%', 
    v_lote_id, v_liberadas, v_concluidas, v_inativadas;

  -- Se critério atendido, atualizar para 'concluido'
  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    UPDATE lotes_avaliacao
    SET status = 'concluido',
        atualizado_em = NOW()
    WHERE id = v_lote_id
      AND status != 'concluido';
    
    RAISE NOTICE 'OK: Lote % atualizado para status "concluido"', v_lote_id;
    
    -- Criar notificação para RH/Entidade
    INSERT INTO notificacoes (
      tipo,
      destinatario_cpf,
      titulo,
      mensagem,
      lote_id,
      criado_em
    )
    SELECT
      'lote_concluido',
      la.liberado_por,
      'Lote pronto para emissao de laudo',
      'O lote #' || la.id || ' foi concluido e esta pronto para solicitar a emissao do laudo.',
      la.id,
      NOW()
    FROM lotes_avaliacao la
    WHERE la.id = v_lote_id
      AND la.liberado_por IS NOT NULL;
    
    RAISE NOTICE 'OK: Notificacao criada para o responsavel pelo lote';
  ELSE
    RAISE WARNING 'AVISO: Lote % nao atende criterio de conclusao', v_lote_id;
    RAISE WARNING '   Esperado: concluidas (%) + inativadas (%) = liberadas (%)', 
      v_concluidas, v_inativadas, v_liberadas;
  END IF;
END $$;

-- 4. Verificar resultado final
SELECT 
  la.id,
  la.status as status_lote,
  COUNT(a.id) as total_avaliacoes,
  COUNT(a.id) FILTER (WHERE a.status = 'concluida') as concluidas,
  COUNT(a.id) FILTER (WHERE a.status = 'inativada') as inativadas,
  COUNT(a.id) FILTER (WHERE a.status != 'rascunho') as liberadas
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON la.id = a.lote_id
WHERE la.id = 6
GROUP BY la.id, la.status;

COMMIT;

-- ==========================================
-- VERIFICACAO POS-CORRECAO
-- ==========================================

-- Confirmar que botao "Solicitar Emissao" agora esta habilitado:
-- - lote.status = 'concluido' OK
-- - pendentes = 0 OK
-- - Botao deve aparecer na UI

-- Log de auditoria
SELECT 
  action,
  resource,
  resource_id,
  old_data,
  new_data,
  user_cpf,
  created_at
FROM audit_logs
WHERE resource = 'lotes_avaliacao'
  AND resource_id = '6'
ORDER BY created_at DESC
LIMIT 5;
