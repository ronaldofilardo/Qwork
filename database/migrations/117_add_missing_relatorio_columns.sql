-- Migração de segurança: garante que colunas de relatório em `laudos` existam
-- Adiciona colunas usadas pelos endpoints de geração de relatórios (individual/lote/setor)

ALTER TABLE laudos
ADD COLUMN IF NOT EXISTS relatorio_individual BYTEA,
ADD COLUMN IF NOT EXISTS relatorio_lote BYTEA,
ADD COLUMN IF NOT EXISTS relatorio_setor BYTEA,
ADD COLUMN IF NOT EXISTS hash_relatorio_individual VARCHAR(64),
ADD COLUMN IF NOT EXISTS hash_relatorio_lote VARCHAR(64),
ADD COLUMN IF NOT EXISTS hash_relatorio_setor VARCHAR(64);

-- Índices parciais para performance
CREATE INDEX IF NOT EXISTS idx_laudos_relatorio_individual ON laudos (relatorio_individual) WHERE relatorio_individual IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_laudos_relatorio_lote ON laudos (relatorio_lote) WHERE relatorio_lote IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_laudos_relatorio_setor ON laudos (relatorio_setor) WHERE relatorio_setor IS NOT NULL;

COMMENT ON COLUMN laudos.relatorio_individual IS 'Arquivo PDF do relatório individual do funcionário';
COMMENT ON COLUMN laudos.relatorio_lote IS 'Arquivo PDF do relatório do lote completo';
COMMENT ON COLUMN laudos.relatorio_setor IS 'Arquivo PDF do relatório setorial/estatístico';
COMMENT ON COLUMN laudos.hash_relatorio_individual IS 'Hash SHA-256 do relatório individual para integridade';
COMMENT ON COLUMN laudos.hash_relatorio_lote IS 'Hash SHA-256 do relatório de lote para integridade';
COMMENT ON COLUMN laudos.hash_relatorio_setor IS 'Hash SHA-256 do relatório setorial para integridade';
