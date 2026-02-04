-- ETAPA 15: Implementar conceito de Lotes de Avaliações
-- Criar tabela lotes_avaliacao e modificar avaliacoes para vincular a lotes

-- 1. Criar tabela lotes_avaliacao
CREATE TABLE IF NOT EXISTS lotes_avaliacao (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL, -- Ex: 001-291125
    clinica_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(20) DEFAULT 'completo' CHECK (tipo IN ('completo', 'operacional', 'gestao')),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado', 'finalizado', 'concluido', 'rascunho')),
    liberado_por CHAR(11) NOT NULL REFERENCES funcionarios(cpf),
    liberado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

-- Chaves estrangeiras
FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas_clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (liberado_por) REFERENCES funcionarios(cpf)
);

-- 2. Adicionar coluna lote_id na tabela avaliacoes
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS lote_id INTEGER;

-- 3. Criar chave estrangeira para lotes_avaliacao
ALTER TABLE avaliacoes
ADD CONSTRAINT avaliacoes_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES lotes_avaliacao (id) ON DELETE SET NULL;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lotes_clinica ON lotes_avaliacao (clinica_id);

CREATE INDEX IF NOT EXISTS idx_lotes_empresa ON lotes_avaliacao (empresa_id);

CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes_avaliacao (status);

CREATE INDEX IF NOT EXISTS idx_lotes_codigo ON lotes_avaliacao (codigo);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_lote ON avaliacoes (lote_id);

-- 5. Função para gerar código automático do lote
CREATE OR REPLACE FUNCTION gerar_codigo_lote()
RETURNS VARCHAR(20) AS $$
DECLARE
    data_atual VARCHAR(6);
    sequencial INT;
    codigo VARCHAR(20);
BEGIN
    -- Formato: 001-DDMMYY (ex: 001-291125)
    data_atual := TO_CHAR(CURRENT_DATE, 'DDMMYY');

    -- Buscar próximo sequencial para a data
    SELECT COALESCE(MAX(CAST(SPLIT_PART( '-', 1) AS INTEGER)), 0) + 1
    INTO sequencial
    FROM lotes_avaliacao la
    WHERE la.codigo LIKE '%-' || data_atual;

    -- Formatar código com zeros à esquerda
    codigo := LPAD(sequencial::TEXT, 3, '0') || '-' || data_atual;

    RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- 6. Verificar estrutura criada
SELECT '=== TABELA LOTES_AVALIACAO CRIADA ===' as titulo;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE
    table_name = 'lotes_avaliacao'
ORDER BY ordinal_position;

SELECT 'ETAPA 15 CONCLUIDA - SISTEMA DE LOTES IMPLEMENTADO!' as resultado;