-- Migration 1007: Fix Stuck Evaluations - Avaliações travadas por laudo reservado incorretamente
-- Data: 2026-02-04
-- Problema: Avaliações com 37 respostas não conseguem ser marcadas como concluídas 
--           porque laudos foram criados com status "emitido" prematuramente

BEGIN;

-- =====================================================
-- 1. IDENTIFICAR E CORRIGIR LAUDOS INCORRETOS
-- =====================================================

-- Laudos que foram criados apenas como reserva mas têm status "emitido" sem dados
UPDATE laudos
SET status = NULL,
    emitido_em = NULL,
    enviado_em = NULL
WHERE status = 'emitido'
  AND emissor_cpf IS NULL
  AND emitido_em IS NULL
  AND hash_pdf IS NULL
  AND observacoes IS NULL;

-- Log de correção
DO $$
DECLARE
    v_corrected INT;
BEGIN
    GET DIAGNOSTICS v_corrected = ROW_COUNT;
    RAISE NOTICE '✅ Corrigidos % laudos com status incorreto (apenas reserva de ID)', v_corrected;
END $$;

-- =====================================================
-- 2. ATUALIZAR AVALIAÇÕES COMPLETAS NÃO CONCLUÍDAS
-- =====================================================

-- Configurar contexto de usuário sistema para auditoria
DO $$
BEGIN
    PERFORM set_config('app.current_user_cpf', '00000000000', false);
    PERFORM set_config('app.current_user_perfil', 'system', false);
    PERFORM set_config('app.client_ip', '127.0.0.1', false);
END $$;

-- Desabilitar temporariamente triggers que bloqueiam
ALTER TABLE avaliacoes DISABLE TRIGGER prevent_avaliacao_update_after_emission;
ALTER TABLE avaliacoes DISABLE TRIGGER prevent_avaliacao_delete_after_emission;
ALTER TABLE avaliacoes DISABLE TRIGGER trg_protect_avaliacao_after_emit;
ALTER TABLE avaliacoes DISABLE TRIGGER trigger_prevent_avaliacao_mutation_during_emission;

-- Atualizar avaliações que têm 37+ respostas mas não estão concluídas
WITH avaliacoes_completas AS (
    SELECT 
        a.id,
        a.status,
        COUNT(DISTINCT (r.grupo, r.item)) as total_respostas
    FROM avaliacoes a
    JOIN respostas r ON a.id = r.avaliacao_id
    WHERE a.status != 'concluida'
    GROUP BY a.id, a.status
    HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
)
UPDATE avaliacoes a
SET 
    status = 'concluida',
    envio = COALESCE(envio, NOW()),
    concluida_em = COALESCE(concluida_em, NOW()),
    atualizado_em = NOW()
FROM avaliacoes_completas ac
WHERE a.id = ac.id
  AND a.status != 'concluida';

-- Log de correção
DO $$
DECLARE
    v_updated INT;
BEGIN
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE '✅ Marcadas % avaliações como concluídas (tinham 37+ respostas)', v_updated;
END $$;

-- Reabilitar triggers
ALTER TABLE avaliacoes ENABLE TRIGGER prevent_avaliacao_update_after_emission;
ALTER TABLE avaliacoes ENABLE TRIGGER prevent_avaliacao_delete_after_emission;
ALTER TABLE avaliacoes ENABLE TRIGGER trg_protect_avaliacao_after_emit;
ALTER TABLE avaliacoes ENABLE TRIGGER trigger_prevent_avaliacao_mutation_during_emission;

-- =====================================================
-- 3. RECALCULAR STATUS DOS LOTES AFETADOS
-- =====================================================

-- Atualizar status de lotes que devem estar "concluido"
WITH lotes_para_concluir AS (
    SELECT 
        la.id,
        COUNT(a.id) as total_avaliacoes,
        COUNT(a.id) FILTER (WHERE a.status != 'rascunho') as liberadas,
        COUNT(a.id) FILTER (WHERE a.status = 'concluida') as concluidas,
        COUNT(a.id) FILTER (WHERE a.status = 'inativada') as inativadas
    FROM lotes_avaliacao la
    JOIN avaliacoes a ON la.id = a.lote_id
    WHERE la.status NOT IN ('concluido', 'cancelado', 'finalizado')
    GROUP BY la.id
    HAVING 
        COUNT(a.id) FILTER (WHERE a.status != 'rascunho') > 0
        AND COUNT(a.id) FILTER (WHERE a.status = 'concluida') > 0
        AND (COUNT(a.id) FILTER (WHERE a.status = 'concluida') + 
             COUNT(a.id) FILTER (WHERE a.status = 'inativada')) = 
            COUNT(a.id) FILTER (WHERE a.status != 'rascunho')
)
UPDATE lotes_avaliacao la
SET 
    status = 'concluido',
    atualizado_em = NOW()
FROM lotes_para_concluir lpc
WHERE la.id = lpc.id
  AND la.status != 'concluido';

-- Log de correção
DO $$
DECLARE
    v_lotes_updated INT;
BEGIN
    GET DIAGNOSTICS v_lotes_updated = ROW_COUNT;
    RAISE NOTICE '✅ Atualizados % lotes para status "concluido"', v_lotes_updated;
END $$;

-- =====================================================
-- 4. VALIDAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    v_avaliacoes_incompletas INT;
    v_laudos_incorretos INT;
BEGIN
    -- Verificar se ainda há avaliações incompletas
    SELECT COUNT(*) INTO v_avaliacoes_incompletas
    FROM avaliacoes a
    WHERE a.status != 'concluida'
      AND EXISTS (
          SELECT 1 FROM respostas r 
          WHERE r.avaliacao_id = a.id 
          GROUP BY r.avaliacao_id 
          HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
      );
    
    -- Verificar se ainda há laudos com status incorreto
    SELECT COUNT(*) INTO v_laudos_incorretos
    FROM laudos
    WHERE status = 'emitido'
      AND emissor_cpf IS NULL
      AND emitido_em IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================================';
    RAISE NOTICE ' MIGRATION 1007 - VALIDAÇÃO';
    RAISE NOTICE '====================================================';
    
    IF v_avaliacoes_incompletas = 0 AND v_laudos_incorretos = 0 THEN
        RAISE NOTICE '✅ Todas as avaliações completas foram marcadas como concluídas';
        RAISE NOTICE '✅ Todos os laudos têm status correto';
    ELSE
        IF v_avaliacoes_incompletas > 0 THEN
            RAISE WARNING '⚠️ Ainda há % avaliações completas não marcadas como concluídas', v_avaliacoes_incompletas;
        END IF;
        IF v_laudos_incorretos > 0 THEN
            RAISE WARNING '⚠️ Ainda há % laudos com status incorreto', v_laudos_incorretos;
        END IF;
    END IF;
    
    RAISE NOTICE '====================================================';
END $$;

COMMIT;
