-- Migration 1003: Corrigir fn_reservar_id_laudo_on_lote_insert (evitar colunas inexistentes)
-- Data: 2026-02-04
-- Problema: função tentava inserir em colunas que não existem na tabela laudos (empresa_id, rascunho)
-- Solução: inserir somente nas colunas existentes e necessárias (id, lote_id)

BEGIN;

CREATE OR REPLACE FUNCTION fn_reservar_id_laudo_on_lote_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir registro mínimo para reservar o ID do laudo (id = lote_id)
  INSERT INTO laudos (id, lote_id)
  VALUES (NEW.id, NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_reservar_id_laudo_on_lote_insert IS 'Reserva ID do laudo igual ao lote no momento da inserção (colunas mínimas: id, lote_id)';

COMMIT;
