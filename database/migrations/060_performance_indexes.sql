-- Migração para otimizar performance das consultas RH lentas
-- Adiciona índices para ORDER BY e GROUP BY

-- Índice para ORDER BY em laudos (enviado_em DESC)
CREATE INDEX IF NOT EXISTS idx_laudos_enviado_em ON laudos (enviado_em DESC);

-- Índice para ORDER BY em lotes_avaliacao (liberado_em DESC)
CREATE INDEX IF NOT EXISTS idx_lotes_liberado_em ON lotes_avaliacao (liberado_em DESC);

-- Índice para GROUP BY em resultados (grupo, dominio)
CREATE INDEX IF NOT EXISTS idx_resultados_grupo_dominio ON resultados (grupo, dominio);

-- Índice para ORDER BY em funcionarios (nome)
CREATE INDEX IF NOT EXISTS idx_funcionarios_nome ON funcionarios (nome);

-- Índice composto para otimizar consultas de resultados por avaliação
CREATE INDEX IF NOT EXISTS idx_resultados_avaliacao_grupo ON resultados (avaliacao_id, grupo);

-- Índice para consultas de avaliacoes por status e lote
CREATE INDEX IF NOT EXISTS idx_avaliacoes_lote_status ON avaliacoes (lote_id, status);

-- Índice para consultas de funcionarios por clinica e empresa
CREATE INDEX IF NOT EXISTS idx_funcionarios_clinica_empresa ON funcionarios (clinica_id, empresa_id);

-- Índice para consultas de empresas_clientes por clinica e ativa
CREATE INDEX IF NOT EXISTS idx_empresas_clinica_ativa ON empresas_clientes (clinica_id, ativa);