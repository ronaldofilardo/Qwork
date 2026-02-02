-- ============================================================================
-- Migration 998: Adicionar Constraint UNIQUE em fila_emissao
-- Data: 2026-01-30
-- Descrição: Previne duplicação de lotes na fila de emissão
-- ============================================================================
-- 
-- OBJETIVO: Garantir que cada lote pode aparecer apenas uma vez na fila
-- IMPACTO: Previne race conditions ao solicitar emissão múltiplas vezes
-- ============================================================================

BEGIN;

\echo '========================================='
\echo 'MIGRATION 998: CONSTRAINT UNIQUE EM fila_emissao'
\echo '========================================='

-- ============================================================================
-- 1. VERIFICAR E LIMPAR DUPLICAÇÕES EXISTENTES
-- ============================================================================
\echo '1. Verificando duplicações existentes...'

-- Identificar e remover duplicações mantendo apenas a entrada mais recente
DO $$
DECLARE
    total_duplicados INTEGER;
BEGIN
    WITH duplicados AS (
        SELECT lote_id, 
               COUNT(*) as total,
               ARRAY_AGG(id ORDER BY id DESC) as ids
        FROM fila_emissao
        GROUP BY lote_id
        HAVING COUNT(*) > 1
    )
    SELECT COUNT(*) INTO total_duplicados FROM duplicados;

    IF total_duplicados > 0 THEN
        RAISE NOTICE 'Encontradas % duplicações na fila_emissao', total_duplicados;
        
        -- Remover duplicações mantendo apenas o registro mais recente
        DELETE FROM fila_emissao
        WHERE id IN (
            SELECT unnest(ids[2:array_length(ids, 1)])
            FROM (
                SELECT lote_id, 
                       ARRAY_AGG(id ORDER BY id DESC) as ids
                FROM fila_emissao
                GROUP BY lote_id
                HAVING COUNT(*) > 1
            ) sub
        );
        
        RAISE NOTICE 'Duplicações removidas com sucesso';
    ELSE
        RAISE NOTICE 'Nenhuma duplicação encontrada';
    END IF;
END $$;

-- ============================================================================
-- 2. ADICIONAR CONSTRAINT UNIQUE
-- ============================================================================
\echo '2. Adicionando constraint UNIQUE...'

-- Adicionar constraint apenas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fila_emissao_lote_id_unique'
    ) THEN
        ALTER TABLE fila_emissao
        ADD CONSTRAINT fila_emissao_lote_id_unique UNIQUE (lote_id);
        
        RAISE NOTICE 'Constraint UNIQUE criada com sucesso';
    ELSE
        RAISE NOTICE 'Constraint UNIQUE já existe';
    END IF;
END $$;

-- ============================================================================
-- 3. CRIAR ÍNDICE PARCIAL PARA PERFORMANCE
-- ============================================================================
\echo '3. Criando índice parcial para otimização...'

-- Índice apenas para registros com tentativas pendentes
CREATE INDEX IF NOT EXISTS idx_fila_emissao_lote_tentativas_pendentes
ON fila_emissao(lote_id)
WHERE tentativas < max_tentativas;

-- Índice para buscar próximos itens a processar
CREATE INDEX IF NOT EXISTS idx_fila_emissao_proxima_tentativa
ON fila_emissao(proxima_tentativa)
WHERE tentativas < max_tentativas;

-- ============================================================================
-- 4. VALIDAÇÃO E ESTATÍSTICAS
-- ============================================================================
\echo '4. Validando migration...'

DO $$
DECLARE
    total_registros INTEGER;
    total_indices INTEGER;
BEGIN
    -- Contar registros
    SELECT COUNT(*) INTO total_registros FROM fila_emissao;
    
    -- Verificar índices
    SELECT COUNT(*) INTO total_indices 
    FROM pg_indexes 
    WHERE tablename = 'fila_emissao';
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'ESTATÍSTICAS FINAIS:';
    RAISE NOTICE 'Total de registros na fila: %', total_registros;
    RAISE NOTICE 'Total de índices criados: %', total_indices;
    RAISE NOTICE '===========================================';
END $$;

COMMIT;

\echo 'Migration 998 concluída com sucesso!'
