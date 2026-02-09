-- Migration 075: Aplicar sistema de índice de avaliação (migration 016)
-- Data: 2026-01-23
-- Contexto: A migration 016 não havia sido aplicada ao banco dev, causando erros em liberar-lote

-- Esta migration aplica as partes essenciais da migration-016-indice-avaliacao.sql
-- para garantir que o sistema de índice funcione corretamente

BEGIN;

-- ==========================================
-- 1. ADICIONAR CAMPOS NA TABELA FUNCIONARIOS
-- ==========================================

-- Campo indice_avaliacao: número da última avaliação concluída (0 para novos)
ALTER TABLE funcionarios
ADD COLUMN IF NOT EXISTS indice_avaliacao INTEGER DEFAULT 0 NOT NULL;

-- Campo data_ultimo_lote: timestamp da última avaliação válida (auxilia cálculo >1 ano)
ALTER TABLE funcionarios
ADD COLUMN IF NOT EXISTS data_ultimo_lote TIMESTAMP NULL;

COMMENT ON COLUMN funcionarios.indice_avaliacao IS 'Número sequencial da última avaliação concluída pelo funcionário (0 = nunca fez)';
COMMENT ON COLUMN funcionarios.data_ultimo_lote IS 'Data/hora da última avaliação válida concluída (usado para verificar prazo de 1 ano)';

-- ==========================================
-- 2. ADICIONAR CAMPOS NA TABELA LOTES_AVALIACAO
-- ==========================================

-- Campo numero_ordem: ordem sequencial do lote na empresa (1, 2, 3...)
ALTER TABLE lotes_avaliacao
ADD COLUMN IF NOT EXISTS numero_ordem INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN lotes_avaliacao.numero_ordem IS 'Número sequencial do lote na empresa (ex: 10 para o 10º lote da empresa)';

-- ==========================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índice para buscar funcionários por indice_avaliacao
CREATE INDEX IF NOT EXISTS idx_funcionarios_indice_avaliacao ON funcionarios (indice_avaliacao);

-- Índice para buscar por data_ultimo_lote
CREATE INDEX IF NOT EXISTS idx_funcionarios_data_ultimo_lote ON funcionarios (data_ultimo_lote)
WHERE data_ultimo_lote IS NOT NULL;

-- Índice para buscar lotes por numero_ordem
CREATE INDEX IF NOT EXISTS idx_lotes_numero_ordem ON lotes_avaliacao (empresa_id, numero_ordem DESC);

-- Índice composto para funcionários ativos com pendências
CREATE INDEX IF NOT EXISTS idx_funcionarios_pendencias ON funcionarios (
    empresa_id,
    ativo,
    indice_avaliacao,
    data_ultimo_lote
)
WHERE ativo = true;

-- ==========================================
-- 4. FUNÇÃO: CALCULAR PRÓXIMO NÚMERO DE ORDEM DO LOTE
-- ==========================================

CREATE OR REPLACE FUNCTION obter_proximo_numero_ordem(p_empresa_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_proximo INTEGER;
BEGIN
    -- Buscar o maior número de ordem para a empresa e incrementar
    SELECT COALESCE(MAX(numero_ordem), 0) + 1
    INTO v_proximo
    FROM lotes_avaliacao
    WHERE empresa_id = p_empresa_id;
    
    RETURN v_proximo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obter_proximo_numero_ordem(INTEGER) IS 'Retorna o próximo número de ordem sequencial para um novo lote da empresa';

-- ==========================================
-- 5. POPULAR NUMERO_ORDEM PARA LOTES EXISTENTES
-- ==========================================

-- Atualizar lotes existentes com numero_ordem sequencial por empresa
UPDATE lotes_avaliacao
SET numero_ordem = subquery.rn
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY empresa_id ORDER BY liberado_em, id) AS rn
    FROM lotes_avaliacao
    WHERE empresa_id IS NOT NULL
) AS subquery
WHERE lotes_avaliacao.id = subquery.id;

-- Atualizar lotes sem empresa (tomadores diretos) com numero_ordem sequencial
UPDATE lotes_avaliacao
SET numero_ordem = subquery.rn
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY liberado_em, id) AS rn
    FROM lotes_avaliacao
    WHERE empresa_id IS NULL
) AS subquery
WHERE lotes_avaliacao.id = subquery.id;

SELECT '075.1 Sistema de índice de avaliação aplicado (migration 016)' as status;

COMMIT;
