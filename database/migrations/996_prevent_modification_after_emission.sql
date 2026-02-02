-- ============================================================================
-- Migration 996: Trigger de Imutabilidade Após Emissão
-- Data: 2026-01-30
-- Descrição: Previne modificação de avaliações após laudo emitido
-- ============================================================================
-- 
-- OBJETIVO: Garantir integridade dos dados após emissão do laudo
-- IMPACTO: Avaliações vinculadas a lotes com laudo emitido tornam-se imutáveis
-- ============================================================================

BEGIN;

\echo '========================================='
\echo 'MIGRATION 996: IMUTABILIDADE APÓS EMISSÃO'
\echo '========================================='

-- ============================================================================
-- 1. CRIAR FUNÇÃO DE VALIDAÇÃO
-- ============================================================================
\echo '1. Criando função de validação de imutabilidade...'

CREATE OR REPLACE FUNCTION prevent_modification_after_emission()
RETURNS TRIGGER AS $$
DECLARE
    lote_emitido_em TIMESTAMP;
    lote_codigo VARCHAR;
BEGIN
    -- Buscar informações do lote
    SELECT emitido_em, codigo INTO lote_emitido_em, lote_codigo
    FROM lotes_avaliacao
    WHERE id = NEW.lote_id;
    
    -- Se o laudo foi emitido, bloquear modificação
    IF lote_emitido_em IS NOT NULL THEN
        RAISE EXCEPTION 
            'Não é possível modificar avaliação do lote % (código: %). Laudo foi emitido em %.',
            NEW.lote_id, lote_codigo, lote_emitido_em
        USING 
            ERRCODE = 'integrity_constraint_violation',
            HINT = 'Laudos emitidos são imutáveis para garantir integridade';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_modification_after_emission() IS 
'Previne modificação de avaliações após emissão do laudo (imutabilidade)';

-- ============================================================================
-- 2. CRIAR TRIGGER PARA UPDATE
-- ============================================================================
\echo '2. Criando trigger para UPDATE em avaliacoes...'

DROP TRIGGER IF EXISTS prevent_avaliacao_update_after_emission ON avaliacoes;

CREATE TRIGGER prevent_avaliacao_update_after_emission
BEFORE UPDATE ON avaliacoes
FOR EACH ROW
EXECUTE FUNCTION prevent_modification_after_emission();

COMMENT ON TRIGGER prevent_avaliacao_update_after_emission ON avaliacoes IS
'Bloqueia atualização de avaliação quando laudo já foi emitido';

-- ============================================================================
-- 3. CRIAR TRIGGER PARA DELETE
-- ============================================================================
\echo '3. Criando trigger para DELETE em avaliacoes...'

DROP TRIGGER IF EXISTS prevent_avaliacao_delete_after_emission ON avaliacoes;

CREATE TRIGGER prevent_avaliacao_delete_after_emission
BEFORE DELETE ON avaliacoes
FOR EACH ROW
EXECUTE FUNCTION prevent_modification_after_emission();

COMMENT ON TRIGGER prevent_avaliacao_delete_after_emission ON avaliacoes IS
'Bloqueia exclusão de avaliação quando laudo já foi emitido';

-- ============================================================================
-- 4. CRIAR FUNÇÃO PARA PREVENIR MUDANÇA DE LOTE
-- ============================================================================
\echo '4. Criando função para prevenir mudança de status do lote...'

CREATE OR REPLACE FUNCTION prevent_lote_status_change_after_emission()
RETURNS TRIGGER AS $$
BEGIN
    -- Se laudo foi emitido e tentando alterar status
    IF OLD.emitido_em IS NOT NULL AND NEW.status != OLD.status THEN
        -- Permitir apenas transição finalizado -> enviado (fluxo normal)
        IF OLD.status = 'finalizado' AND NEW.status = 'enviado' THEN
            RETURN NEW;
        END IF;
        
        RAISE EXCEPTION 
            'Não é possível alterar status do lote % após emissão do laudo. Status atual: %, tentativa: %',
            OLD.codigo, OLD.status, NEW.status
        USING 
            ERRCODE = 'integrity_constraint_violation',
            HINT = 'Lotes com laudo emitido são imutáveis';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_lote_status_change_after_emission() IS 
'Previne mudança de status do lote após emissão do laudo';

-- ============================================================================
-- 5. CRIAR TRIGGER PARA LOTES
-- ============================================================================
\echo '5. Criando trigger para UPDATE em lotes_avaliacao...'

DROP TRIGGER IF EXISTS prevent_lote_update_after_emission ON lotes_avaliacao;

CREATE TRIGGER prevent_lote_update_after_emission
BEFORE UPDATE ON lotes_avaliacao
FOR EACH ROW
EXECUTE FUNCTION prevent_lote_status_change_after_emission();

COMMENT ON TRIGGER prevent_lote_update_after_emission ON lotes_avaliacao IS
'Bloqueia mudanças indevidas no lote após emissão do laudo';

-- ============================================================================
-- 6. VALIDAÇÃO DOS TRIGGERS
-- ============================================================================
\echo '6. Validando triggers criados...'

DO $$
DECLARE
    total_triggers INTEGER;
    trigger_record RECORD;
BEGIN
    -- Contar triggers criados
    SELECT COUNT(*) INTO total_triggers
    FROM pg_trigger
    WHERE tgname LIKE '%after_emission%';
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'TRIGGERS DE IMUTABILIDADE CRIADOS:';
    RAISE NOTICE '===========================================';
    
    -- Listar triggers
    FOR trigger_record IN 
        SELECT tgname, tgrelid::regclass AS table_name, 
               CASE 
                   WHEN tgtype & 2 = 2 THEN 'BEFORE'
                   ELSE 'AFTER'
               END AS trigger_timing,
               CASE 
                   WHEN tgtype & 4 = 4 THEN 'INSERT'
                   WHEN tgtype & 8 = 8 THEN 'DELETE'
                   WHEN tgtype & 16 = 16 THEN 'UPDATE'
               END AS trigger_event
        FROM pg_trigger
        WHERE tgname LIKE '%after_emission%'
        ORDER BY tgrelid::regclass::text, tgname
    LOOP
        RAISE NOTICE 'Trigger: % em % (% %)', 
            trigger_record.tgname, 
            trigger_record.table_name,
            trigger_record.trigger_timing,
            trigger_record.trigger_event;
    END LOOP;
    
    RAISE NOTICE 'Total de triggers: %', total_triggers;
    RAISE NOTICE '===========================================';
    
    -- Validar quantidade esperada
    IF total_triggers < 3 THEN
        RAISE EXCEPTION 'Triggers insuficientes! Esperado: 3, Atual: %', total_triggers;
    END IF;
    
    RAISE NOTICE 'Validação concluída com sucesso!';
END $$;

-- ============================================================================
-- 7. CRIAR ÍNDICE PARA PERFORMANCE DO TRIGGER
-- ============================================================================
\echo '7. Criando índice para otimização...'

-- Índice para buscar lotes emitidos rapidamente
CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_emitido_em
ON lotes_avaliacao(id)
WHERE emitido_em IS NOT NULL;

COMMIT;

\echo 'Migration 996 concluída com sucesso!'
\echo ''
\echo 'RESUMO:'
\echo '- Avaliações com laudo emitido: IMUTÁVEIS (UPDATE/DELETE bloqueados)'
\echo '- Lotes com laudo emitido: IMUTÁVEIS (mudança de status bloqueada)'
\echo '- Exceção: finalizado -> enviado (fluxo normal permitido)'
