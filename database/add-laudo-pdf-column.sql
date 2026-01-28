-- Adicionar coluna para armazenar o PDF do laudo
ALTER TABLE laudos ADD COLUMN arquivo_pdf BYTEA;

-- Adicionar comentário explicativo
COMMENT ON COLUMN laudos.arquivo_pdf IS 'Arquivo PDF do Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1 / GRO) gerado pelo emissor, armazenado como binário';