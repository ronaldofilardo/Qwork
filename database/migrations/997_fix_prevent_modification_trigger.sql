-- ============================================================================
-- Migration: Fix Trigger prevent_modification_after_emission
-- Data: 2026-02-04
-- Descrição: Corrigir trigger que referencia coluna 'codigo' inexistente
-- ============================================================================

BEGIN;

\echo '========================================='
\echo 'FIX: TRIGGER prevent_modification_after_emission'
\echo '========================================='

-- Recriar função removendo referência à coluna 'codigo'
CREATE OR REPLACE FUNCTION prevent_modification_after_emission()
RETURNS TRIGGER AS $$
DECLARE
    lote_emitido_em TIMESTAMP;
    lote_id_val INT;
BEGIN
    -- Determinar o lote_id (usar NEW para INSERT/UPDATE, OLD para DELETE)
    IF TG_OP = 'DELETE' THEN
        lote_id_val := OLD.lote_id;
    ELSE
        lote_id_val := NEW.lote_id;
    END IF;

    -- Buscar informações do lote
    SELECT emitido_em INTO lote_emitido_em
    FROM lotes_avaliacao
    WHERE id = lote_id_val;
    
    -- Se o laudo foi emitido, bloquear modificação
    IF lote_emitido_em IS NOT NULL THEN
        RAISE EXCEPTION 
            'Não é possível modificar avaliação do lote % (emitido em %). Laudo foi emitido em %.',
            lote_id_val, lote_emitido_em, lote_emitido_em
        USING 
            ERRCODE = 'integrity_constraint_violation',
            HINT = 'Laudos emitidos são imutáveis para garantir integridade';
    END IF;
    
    -- Retornar registro apropriado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_modification_after_emission() IS 
'Previne modificação de avaliações após emissão do laudo (imutabilidade) - versão corrigida sem coluna codigo';

\echo 'Função prevent_modification_after_emission atualizada com sucesso!'

COMMIT;

\echo '✅ Migration concluída com sucesso!'
