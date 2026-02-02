-- ETAPA 16: Implementar sistema de laudos para emissor
-- Criar tabela laudos e relacionamentos

-- 1. Criar tabela laudos
CREATE TABLE IF NOT EXISTS laudos (
    id SERIAL PRIMARY KEY,
    lote_id INTEGER NOT NULL,
    emissor_cpf CHAR(11) NOT NULL REFERENCES funcionarios(cpf),
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'emitido', 'enviado')),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    emitido_em TIMESTAMP,
    enviado_em TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

-- Chaves estrangeiras
FOREIGN KEY (lote_id) REFERENCES lotes_avaliacao (id) ON DELETE CASCADE,
FOREIGN KEY (emissor_cpf) REFERENCES funcionarios (cpf),

-- Restrições
CONSTRAINT laudos_lote_emissor_unique UNIQUE (lote_id, emissor_cpf)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_laudos_lote ON laudos (lote_id);

CREATE INDEX IF NOT EXISTS idx_laudos_emissor ON laudos (emissor_cpf);

CREATE INDEX IF NOT EXISTS idx_laudos_status ON laudos (status);

-- 3. Verificar estrutura criada
SELECT '=== TABELA LAUDOS CRIADA ===' as titulo;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE
    table_name = 'laudos'
ORDER BY ordinal_position;

SELECT 'ETAPA 16 CONCLUIDA - SISTEMA DE LAUDOS IMPLEMENTADO!' as resultado;