-- MIGRATION 016: Sistema de Índice de Avaliação
-- Implementa índice numérico sequencial para rastreamento de avaliações
-- Garante obrigatoriedade: nenhum funcionário pode ficar >1 ano sem avaliação

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
-- 3. ATUALIZAR STATUS EM AVALIACOES (Já existe, apenas documentar)
-- ==========================================

-- Verificar se constraint já suporta 'inativada'
DO $$
BEGIN
  -- A constraint já suporta 'inativada' conforme schema atual
  -- Apenas documentar para clareza
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'avaliacoes_status_check' 
    AND pg_get_constraintdef(oid) LIKE '%inativada%'
  ) THEN
    ALTER TABLE avaliacoes DROP CONSTRAINT IF EXISTS avaliacoes_status_check;
    ALTER TABLE avaliacoes ADD CONSTRAINT avaliacoes_status_check 
    CHECK (status IN ('iniciada', 'em_andamento', 'concluido', 'inativada'));
  END IF;
END $$;

COMMENT ON COLUMN avaliacoes.status IS 'Status da avaliação: iniciada, em_andamento, concluida, inativada (não incrementa índice)';

-- ==========================================
-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índice para buscar funcionários por indice_avaliacao (usado em queries de elegibilidade)
CREATE INDEX IF NOT EXISTS idx_funcionarios_indice_avaliacao ON funcionarios (indice_avaliacao);

-- Índice para buscar por data_ultimo_lote (queries >1 ano)
CREATE INDEX IF NOT EXISTS idx_funcionarios_data_ultimo_lote ON funcionarios (data_ultimo_lote)
WHERE
    data_ultimo_lote IS NOT NULL;

-- Índice para buscar lotes por numero_ordem
CREATE INDEX IF NOT EXISTS idx_lotes_numero_ordem ON lotes_avaliacao (empresa_id, numero_ordem DESC);

-- Índice composto para funcionários ativos com pendências
CREATE INDEX IF NOT EXISTS idx_funcionarios_pendencias ON funcionarios (
    empresa_id,
    ativo,
    indice_avaliacao,
    data_ultimo_lote
)
WHERE
    ativo = true;

-- ==========================================
-- 5. FUNÇÃO: CALCULAR PRÓXIMO NÚMERO DE ORDEM DO LOTE
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

COMMENT ON FUNCTION obter_proximo_numero_ordem (INTEGER) IS 'Retorna o próximo número de ordem sequencial para um novo lote da empresa';

-- ==========================================
-- 6. POPULAR NUMERO_ORDEM PARA LOTES EXISTENTES
-- ==========================================

-- Atualizar lotes existentes com numero_ordem baseado em liberado_em (ordem cronológica)
WITH
    lotes_ordenados AS (
        SELECT id, empresa_id, ROW_NUMBER() OVER (
                PARTITION BY
                    empresa_id
                ORDER BY liberado_em ASC
            ) AS ordem
        FROM lotes_avaliacao
    )
UPDATE lotes_avaliacao la
SET
    numero_ordem = lo.ordem
FROM lotes_ordenados lo
WHERE
    la.id = lo.id
    AND la.numero_ordem = 1;
-- Apenas se ainda for default

-- ==========================================
-- 7. POPULAR INDICE_AVALIACAO PARA FUNCIONÁRIOS EXISTENTES
-- ==========================================

-- Atualizar indice_avaliacao com base no último lote concluído
WITH
    ultima_avaliacao AS (
        SELECT
            a.funcionario_cpf,
            MAX(la.numero_ordem) AS ultimo_numero,
            MAX(a.envio) AS data_conclusao
        FROM
            avaliacoes a
            JOIN lotes_avaliacao la ON a.lote_id = la.id
        WHERE
            a.status = 'concluido'
        GROUP BY
            a.funcionario_cpf
    )
UPDATE funcionarios f
SET
    indice_avaliacao = COALESCE(ua.ultimo_numero, 0),
    data_ultimo_lote = ua.data_conclusao
FROM ultima_avaliacao ua
WHERE
    f.cpf = ua.funcionario_cpf;

-- ==========================================
-- 8. VERIFICAÇÕES E VALIDAÇÕES
-- ==========================================

-- Verificar estrutura criada
DO $$
DECLARE
    v_count_funcionarios INTEGER;
    v_count_lotes INTEGER;
BEGIN
    -- Verificar se campos foram adicionados
    SELECT COUNT(*) INTO v_count_funcionarios
    FROM information_schema.columns
    WHERE table_name = 'funcionarios' 
    AND column_name IN ('indice_avaliacao', 'data_ultimo_lote');
    
    SELECT COUNT(*) INTO v_count_lotes
    FROM information_schema.columns
    WHERE table_name = 'lotes_avaliacao' 
    AND column_name = 'numero_ordem';
    
    IF v_count_funcionarios <> 2 THEN
        RAISE EXCEPTION 'Erro: Campos indice_avaliacao ou data_ultimo_lote não foram criados';
    END IF;
    
    IF v_count_lotes <> 1 THEN
        RAISE EXCEPTION 'Erro: Campo numero_ordem não foi criado';
    END IF;
    
    RAISE NOTICE 'MIGRATION 016 CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE 'Campos adicionados: indice_avaliacao, data_ultimo_lote, numero_ordem';
    RAISE NOTICE 'Índices criados para performance';
END $$;

-- ==========================================
-- 9. ESTATÍSTICAS PÓS-MIGRATION
-- ==========================================

-- Estatísticas de índices de avaliação
SELECT
    'Funcionários por índice' AS metrica,
    indice_avaliacao,
    COUNT(*) AS total,
    COUNT(*) FILTER (
        WHERE
            ativo = true
    ) AS ativos
FROM funcionarios
GROUP BY
    indice_avaliacao
ORDER BY indice_avaliacao;

-- Lotes por empresa com numero_ordem
SELECT
    ec.nome AS empresa,
    COUNT(la.id) AS total_lotes,
    MAX(la.numero_ordem) AS ultimo_lote
FROM
    empresas_clientes ec
    LEFT JOIN lotes_avaliacao la ON ec.id = la.empresa_id
GROUP BY
    ec.nome
ORDER BY ec.nome;
