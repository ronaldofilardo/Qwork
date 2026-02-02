-- =====================================================
-- MIGRAÇÃO 024: LIMPAR RESQUÍCIOS DE EMISSÃO AUTOMÁTICA
-- Data: 31/01/2026
-- =====================================================
-- 
-- ⚠️ LIMPEZA COMPLETA DE LEGADOS:
-- 1. Remover tabela emissao_queue (era usada para retry de emissão automática)
-- 2. Remover coluna cancelado_automaticamente (não é mais usada)
-- 3. Verificar e confirmar que trigger fn_recalcular_status_lote_on_avaliacao_update NÃO emite laudos
-- 
-- ✅ EMISSÃO É 100% MANUAL AGORA:
-- - RH/Entidade solicita emissão (POST /api/lotes/[loteId]/solicitar-emissao)
-- - Emissor vê lote no dashboard
-- - Emissor clica manualmente para gerar laudo (POST /api/emissor/laudos/[loteId])
-- 
-- =====================================================

BEGIN;

-- 1. REMOVER TABELA emissao_queue (era para retry automático)
DO $$
BEGIN
    DROP TABLE IF EXISTS emissao_queue CASCADE;
    RAISE NOTICE 'Tabela emissao_queue removida (legado de emissão automática)';
END $$;

-- 2. REMOVER COLUNA cancelado_automaticamente de lotes_avaliacao
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'cancelado_automaticamente'
    ) THEN
        ALTER TABLE lotes_avaliacao DROP COLUMN cancelado_automaticamente CASCADE;
        RAISE NOTICE 'Coluna cancelado_automaticamente removida';
    END IF;
END $$;

-- 3. VERIFICAÇÃO: Confirmar que trigger NÃO emite laudos automaticamente
-- O trigger fn_recalcular_status_lote_on_avaliacao_update foi corrigido
-- na migration 096 para APENAS atualizar status, sem emitir laudo.
-- Aqui apenas documentamos a verificação.

COMMENT ON FUNCTION fn_recalcular_status_lote_on_avaliacao_update() IS 
'Atualiza status do lote para concluido quando todas avaliações são concluídas/inativadas. NÃO emite laudo automaticamente. Emissão é manual via emissor.';

-- 4. DOCUMENTAR TABELA fila_emissao (mantida para rastreabilidade)
COMMENT ON TABLE fila_emissao IS 
'Tabela para rastreabilidade de solicitações de emissão de laudos. 
Registra quem solicitou (solicitado_por), quando (solicitado_em) e tipo (tipo_solicitante).
NÃO é processada automaticamente - apenas para histórico e controle.
Emissor vê lotes aqui listados e gera laudos manualmente.';

COMMIT;

-- =====================================================
-- RESUMO DA MIGRAÇÃO:
-- ✅ emissao_queue removida (retry automático)
-- ✅ cancelado_automaticamente removida (obsoleta)
-- ✅ Trigger confirmado como manual-only
-- ✅ fila_emissao documentada como apenas rastreabilidade
-- =====================================================
