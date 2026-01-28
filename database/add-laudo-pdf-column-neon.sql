# Script para adicionar coluna arquivo_pdf no Neon (produção)
# Execute este script no Neon via SQL Editor ou psql

ALTER TABLE laudos ADD COLUMN IF NOT EXISTS arquivo_pdf BYTEA;

COMMENT ON COLUMN laudos.arquivo_pdf IS 'Arquivo PDF do Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1 / GRO) gerado pelo emissor, armazenado como binário';