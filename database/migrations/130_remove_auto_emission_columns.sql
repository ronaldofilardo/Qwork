-- ==========================================
-- MIGRATION 130: Remover Colunas de Emissão Automática
-- ==========================================
-- Data: 2026-01-31
-- Descrição: Remove definitivamente todas as colunas relacionadas
--            ao sistema de emissão automática descontinuado
--
-- Colunas removidas:
--   - auto_emitir_em
--   - auto_emitir_agendado
--   - processamento_em
--   - cancelado_automaticamente
--   - motivo_cancelamento
-- ==========================================

BEGIN;

\echo '=== MIGRATION 130: Removendo colunas de emissão automática ==='

-- ==========================================
-- 1. REMOVER ÍNDICES RELACIONADOS
-- ==========================================

\echo '1. Removendo índices...'

DROP INDEX IF EXISTS idx_lotes_auto_emitir;
DROP INDEX IF EXISTS idx_lotes_auto_emitir_agendado;
DROP INDEX IF EXISTS idx_lotes_processamento_em;

\echo '   Índices removidos'

-- ==========================================
-- 2. REMOVER TRIGGERS DE AUTOMAÇÃO
-- ==========================================

\echo '2. Removendo triggers de emissão automática...'

-- Remover trigger de cancelamento automático
DROP TRIGGER IF EXISTS trg_verificar_cancelamento_automatico ON avaliacoes;
DROP FUNCTION IF EXISTS verificar_cancelamento_automatico_lote() CASCADE;

-- ⚠️ CRÍTICO: Remover função que agenda emissão automática
DROP FUNCTION IF EXISTS verificar_conclusao_lote() CASCADE;

\echo '   ✓ Triggers de automação removidos'

-- ==========================================
-- 3. REMOVER COLUNAS DA TABELA lotes_avaliacao
-- ==========================================

\echo '3. Removendo colunas de lotes_avaliacao...'

DO $$
BEGIN
    -- Remover auto_emitir_em
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'auto_emitir_em'
    ) THEN
        ALTER TABLE lotes_avaliacao DROP COLUMN auto_emitir_em CASCADE;
        RAISE NOTICE '   ✓ Coluna auto_emitir_em removida';
    ELSE
        RAISE NOTICE '   ○ Coluna auto_emitir_em não existe (já removida)';
    END IF;

    -- Remover auto_emitir_agendado
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'auto_emitir_agendado'
    ) THEN
        ALTER TABLE lotes_avaliacao DROP COLUMN auto_emitir_agendado CASCADE;
        RAISE NOTICE '   ✓ Coluna auto_emitir_agendado removida';
    ELSE
        RAISE NOTICE '   ○ Coluna auto_emitir_agendado não existe (já removida)';
    END IF;

    -- Remover processamento_em
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'processamento_em'
    ) THEN
        ALTER TABLE lotes_avaliacao DROP COLUMN processamento_em CASCADE;
        RAISE NOTICE '   ✓ Coluna processamento_em removida';
    ELSE
        RAISE NOTICE '   ○ Coluna processamento_em não existe (já removida)';
    END IF;

    -- Remover cancelado_automaticamente
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'cancelado_automaticamente'
    ) THEN
        ALTER TABLE lotes_avaliacao DROP COLUMN cancelado_automaticamente CASCADE;
        RAISE NOTICE '   ✓ Coluna cancelado_automaticamente removida';
    ELSE
        RAISE NOTICE '   ○ Coluna cancelado_automaticamente não existe (já removida)';
    END IF;

    -- Remover motivo_cancelamento
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'motivo_cancelamento'
    ) THEN
        ALTER TABLE lotes_avaliacao DROP COLUMN motivo_cancelamento CASCADE;
        RAISE NOTICE '   ✓ Coluna motivo_cancelamento removida';
    ELSE
        RAISE NOTICE '   ○ Coluna motivo_cancelamento não existe (já removida)';
    END IF;
END $$;

\echo '   Colunas removidas'

-- ==========================================
-- 4. ATUALIZAR COMENTÁRIOS
-- ==========================================

\echo '4. Atualizando comentários...'

COMMENT ON TABLE lotes_avaliacao IS 
'Lotes de avaliação. Sistema de emissão é 100% MANUAL.
Status: ativo (em preenchimento) → concluido (pronto para emissão) → finalizado (laudo enviado)';

\echo '   Comentários atualizados'

-- ==========================================
-- 5. VALIDAÇÃO
-- ==========================================

\echo '5. Validando remoção...'

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Verificar se as colunas foram removidas
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns 
    WHERE table_name = 'lotes_avaliacao' 
    AND column_name IN (
        'auto_emitir_em',
        'auto_emitir_agendado', 
        'processamento_em',
        'cancelado_automaticamente',
        'motivo_cancelamento'
    );
    
    IF v_count > 0 THEN
        RAISE EXCEPTION 'FALHA: Ainda existem % colunas de emissão automática', v_count;
    ELSE
        RAISE NOTICE '   ✓ Todas as colunas de emissão automática foram removidas';
    END IF;
    
    -- Verificar se os triggers foram removidos
    SELECT COUNT(*) INTO v_count
    FROM pg_trigger 
    WHERE tgname = 'trg_verificar_cancelamento_automatico';
    
    IF v_count > 0 THEN
        RAISE EXCEPTION 'FALHA: Trigger de cancelamento automático ainda existe';
    ELSE
        RAISE NOTICE '   ✓ Trigger de cancelamento automático removido';
    END IF;

    -- ⚠️ VALIDAÇÃO CRÍTICA: Verificar se função de agendamento foi removida
    SELECT COUNT(*) INTO v_count
    FROM pg_proc 
    WHERE proname IN ('verificar_conclusao_lote', 'verificar_cancelamento_automatico_lote');
    
    IF v_count > 0 THEN
        RAISE EXCEPTION 'FALHA: Funções de automação ainda existem (verificar_conclusao_lote ou verificar_cancelamento_automatico_lote)';
    ELSE
        RAISE NOTICE '   ✓ Funções de automação removidas (verificar_conclusao_lote e verificar_cancelamento_automatico_lote)';
    END IF;
END $$;

COMMIT;

\echo '=== MIGRATION 130: Concluída com sucesso ==='
\echo '⚠️  IMPORTANTE: Sistema agora é 100% MANUAL'
\echo '   - RH/Entidade → Solicitar Emissão (cria notificação)'
\echo '   - Emissor → Vê notificação e gera laudo MANUALMENTE'
\echo ''
\echo '✅ Sistema de emissão automática COMPLETAMENTE removido'
\echo '✅ Emissão de laudos é agora 100% MANUAL pelo emissor'
\echo ''
