-- Adicionar coluna laudo_enviado_em à tabela lotes_avaliacao
-- Esta coluna rastreia quando o laudo do lote foi enviado para a clínica

ALTER TABLE lotes_avaliacao
ADD COLUMN laudo_enviado_em TIMESTAMP
WITH
    TIME ZONE;

-- Adicionar comentário à coluna
COMMENT ON COLUMN lotes_avaliacao.laudo_enviado_em IS 'Data e hora em que o laudo do lote foi enviado para a clínica';