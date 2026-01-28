-- ==========================================
-- MIGRATION 005: Correções de FK Duplicada e Constraints
-- Descrição: Remove FK duplicada em lotes_avaliacao e padroniza constraints
-- Data: 2025-12-14
-- Versão: 1.0.0
-- ==========================================

BEGIN;

\echo 'Iniciando correções de FK duplicada e constraints...'

-- ==========================================
-- 1. REMOVER FK DUPLICADA EM LOTES_AVALIACAO
-- ==========================================

\echo 'Removendo FK duplicada lotes_avaliacao_liberado_por_fkey1...'

-- Verificar se constraint duplicada existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'lotes_avaliacao_liberado_por_fkey1' 
        AND table_name = 'lotes_avaliacao'
    ) THEN
        ALTER TABLE lotes_avaliacao 
        DROP CONSTRAINT lotes_avaliacao_liberado_por_fkey1;
        
        RAISE NOTICE 'FK duplicada removida com sucesso';
    ELSE
        RAISE NOTICE 'FK duplicada não encontrada (já foi removida ou nunca existiu)';
    END IF;
END $$;

-- Garantir que a FK primária existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'lotes_avaliacao_liberado_por_fkey' 
        AND table_name = 'lotes_avaliacao'
    ) THEN
        ALTER TABLE lotes_avaliacao
        ADD CONSTRAINT lotes_avaliacao_liberado_por_fkey 
        FOREIGN KEY (liberado_por) REFERENCES funcionarios(cpf);
        
        RAISE NOTICE 'FK primária criada';
    ELSE
        RAISE NOTICE 'FK primária já existe';
    END IF;
END $$;

-- ==========================================
-- 2. PADRONIZAR CONSTRAINT DE STATUS EM LOTES_AVALIACAO
-- ==========================================

\echo 'Padronizando constraint de status em lotes_avaliacao...'

-- Remover constraint antiga se existir
ALTER TABLE lotes_avaliacao
DROP CONSTRAINT IF EXISTS lotes_avaliacao_status_check;

-- Criar constraint padronizada com 5 valores
ALTER TABLE lotes_avaliacao
ADD CONSTRAINT lotes_avaliacao_status_check CHECK (
    status IN (
        'ativo',
        'cancelado',
        'finalizado',
        'concluido',
        'rascunho'
    )
);

COMMENT ON CONSTRAINT lotes_avaliacao_status_check ON lotes_avaliacao IS 'Constraint padronizada: ativo (em uso), cancelado (cancelado antes de finalizar), finalizado (todas avaliações concluídas), concluido (sinônimo de finalizado), rascunho (em criação)';

-- ==========================================
-- 3. VERIFICAÇÕES DE INTEGRIDADE
-- ==========================================

\echo 'Executando verificações de integridade...'

-- Verificar se há valores de status inválidos
DO $$
DECLARE
    v_invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_invalid_count
    FROM lotes_avaliacao
    WHERE status NOT IN ('ativo', 'cancelado', 'finalizado', 'concluido', 'rascunho');
    
    IF v_invalid_count > 0 THEN
        RAISE WARNING 'Encontrados % registros com status inválido. Execute correção manual antes de prosseguir.', v_invalid_count;
    ELSE
        RAISE NOTICE 'Todos os registros têm status válido';
    END IF;
END $$;

-- Verificar constraints FK
SELECT
    'lotes_avaliacao' as tabela,
    COUNT(*) as total_constraints_fk,
    STRING_AGG (constraint_name, ', ') as constraint_names
FROM information_schema.table_constraints
WHERE
    table_name = 'lotes_avaliacao'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%liberado_por%';

-- ==========================================
-- 4. RELATÓRIO DE CONCLUSÃO
-- ==========================================

\echo '=== MIGRAÇÃO 005 CONCLUÍDA COM SUCESSO ==='

SELECT
    '✅ FK duplicada removida' as item,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE
                constraint_name = 'lotes_avaliacao_liberado_por_fkey1'
        ) THEN '❌ FALHOU'
        ELSE '✅ OK'
    END as status
UNION ALL
SELECT
    '✅ Constraint de status padronizada',
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.check_constraints cc
                JOIN information_schema.constraint_column_usage ccu USING (constraint_name)
            WHERE
                ccu.table_name = 'lotes_avaliacao'
                AND ccu.column_name = 'status'
                AND cc.check_clause LIKE '%rascunho%'
        ) THEN '✅ OK'
        ELSE '❌ FALHOU'
    END;

COMMIT;