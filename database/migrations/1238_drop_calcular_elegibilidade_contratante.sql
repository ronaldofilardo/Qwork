-- Migration 1238: Remover funcao orfã calcular_elegibilidade_lote_contratante
-- Contexto:
--   A migration 1104 criou calcular_elegibilidade_lote_tomador (novo modelo per-vinculo)
--   mas esqueceu de dropar calcular_elegibilidade_lote_contratante (modelo legado).
--   Esta funcao orfã usa tabela contratantes e coluna contratante_id que foram renomeadas.
--   Referencia unica conhecida: __tests__/indice-avaliacao.test.ts (atualizado na migration de testes).

DROP FUNCTION IF EXISTS calcular_elegibilidade_lote_contratante(INTEGER, INTEGER) CASCADE;
