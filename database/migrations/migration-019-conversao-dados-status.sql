-- Migration 019: Conversão de Dados - concluida → concluido
-- Data: 2026-02-04
-- Descrição: Converte todos os dados existentes de 'concluida' para 'concluido'
--            e remove o status legado do constraint.
--
-- IMPORTANTE: Executar APENAS após validar que Migration 018 está aplicada
--            e que não há código usando 'concluida' diretamente.

BEGIN;

-- =====================================================
-- 1. VERIFICAÇÃO PRÉ-CONVERSÃO
-- =====================================================

DO $$
DECLARE
    v_count_concluida INTEGER;
BEGIN
    -- Verificar se existe algum registro com 'concluida'
    SELECT COUNT(*) INTO v_count_concluida
    FROM avaliacoes
    WHERE status = 'concluida';
    
    RAISE NOTICE 'Encontrados % registros com status concluida', v_count_concluida;
    
    -- Log para auditoria
    INSERT INTO audit_logs (
        user_id,
        resource_type,
        resource_id,
        action,
        descricao,
        ip_address,
        user_agent,
        criado_em
    ) VALUES (
        NULL,
        'system',
        'migration-019-pre',
        'MIGRATION',
        format('Migration 019: PRÉ-conversão - %s registros com concluida', v_count_concluida),
        '127.0.0.1',
        'PostgreSQL Migration',
        NOW()
    );
END $$;

-- =====================================================
-- 2. CONVERSÃO DE DADOS
-- =====================================================

-- Converter todos os registros de 'concluida' para 'concluido'
-- Nota: O trigger normalizar_status_avaliacao deve fazer isso automaticamente,
-- mas vamos garantir com UPDATE direto
UPDATE avaliacoes 
SET status = 'concluido',
    atualizado_em = NOW()
WHERE status = 'concluida';

-- Capturar quantidade convertida
DO $$
DECLARE
    v_converted INTEGER;
BEGIN
    GET DIAGNOSTICS v_converted = ROW_COUNT;
    RAISE NOTICE 'Convertidos % registros de concluida para concluido', v_converted;
    
    -- Log para auditoria
    INSERT INTO audit_logs (
        user_id,
        resource_type,
        resource_id,
        action,
        descricao,
        ip_address,
        user_agent,
        criado_em
    ) VALUES (
        NULL,
        'system',
        'migration-019-convert',
        'MIGRATION',
        format('Migration 019: Convertidos %s registros concluida → concluido', v_converted),
        '127.0.0.1',
        'PostgreSQL Migration',
        NOW()
    );
END $$;

-- =====================================================
-- 3. ATUALIZAR CONSTRAINT (Remover status legado)
-- =====================================================

-- Remover 'concluida' do constraint (manter apenas 'concluido')
ALTER TABLE avaliacoes 
DROP CONSTRAINT IF EXISTS avaliacoes_status_check;

ALTER TABLE avaliacoes 
ADD CONSTRAINT avaliacoes_status_check 
CHECK (status IN (
    'rascunho',
    'iniciada', 
    'em_andamento', 
    'concluido',    -- Padrão único
    'inativada'
));

COMMENT ON CONSTRAINT avaliacoes_status_check ON avaliacoes IS 
'Status válidos para avaliação. Padronizado: usar concluido (masculino, sem acento).';

-- =====================================================
-- 4. VERIFICAÇÃO PÓS-CONVERSÃO
-- =====================================================

DO $$
DECLARE
    v_count_concluida_pos INTEGER;
    v_count_concluido_pos INTEGER;
BEGIN
    -- Verificar se ainda existe algum 'concluida'
    SELECT COUNT(*) INTO v_count_concluida_pos
    FROM avaliacoes
    WHERE status = 'concluida';
    
    -- Contar 'concluido'
    SELECT COUNT(*) INTO v_count_concluido_pos
    FROM avaliacoes
    WHERE status = 'concluido';
    
    IF v_count_concluida_pos > 0 THEN
        RAISE EXCEPTION 'ERRO: Ainda existem % registros com status concluida!', v_count_concluida_pos;
    END IF;
    
    RAISE NOTICE 'Verificação OK: 0 concluida, % concluido', v_count_concluido_pos;
    
    -- Log final
    INSERT INTO audit_logs (
        user_id,
        resource_type,
        resource_id,
        action,
        descricao,
        ip_address,
        user_agent,
        criado_em
    ) VALUES (
        NULL,
        'system',
        'migration-019-complete',
        'MIGRATION',
        format('Migration 019: COMPLETO - 0 concluida, %s concluido', v_count_concluido_pos),
        '127.0.0.1',
        'PostgreSQL Migration',
        NOW()
    );
END $$;

COMMIT;

-- =====================================================
-- ESTATÍSTICAS FINAIS
-- =====================================================

SELECT 
    'Status final das avaliações:' as info,
    status,
    COUNT(*) as total
FROM avaliacoes 
GROUP BY status
ORDER BY status;

SELECT 
    'Constraint final avaliacoes_status_check:' as info,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'avaliacoes_status_check';
