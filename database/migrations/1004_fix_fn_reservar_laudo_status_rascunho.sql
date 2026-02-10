-- Migration 1004: Corrigir fn_reservar_id_laudo_on_lote_insert para usar status='rascunho'
-- Data: 2026-02-10
-- Problema: Migration 1003 simplificou demais e deixou status usar DEFAULT 'emitido'
--           Isso dispara trigger de validação que exige hash_pdf para status='emitido'
-- Solução: Especificar explicitamente status='rascunho' ao reservar ID do laudo
-- Stack trace do erro:
--   "Laudo X não pode ser marcado como emitido sem hash_pdf (violação de imutabilidade)"
--   triggered by fn_validar_laudo_emitido() on INSERT to laudos
--   called by fn_reservar_id_laudo_on_lote_insert() on INSERT to lotes_avaliacao

BEGIN;

-- Recriar função com status explícito
CREATE OR REPLACE FUNCTION fn_reservar_id_laudo_on_lote_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Reservar o ID do laudo (id = lote_id) em status 'rascunho'
  -- Status 'rascunho' permite criar laudo sem hash_pdf/emissor_cpf/emitido_em
  -- Isso evita disparar a trigger de validação fn_validar_laudo_emitido
  INSERT INTO laudos (id, lote_id, status)
  VALUES (NEW.id, NEW.id, 'rascunho')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_reservar_id_laudo_on_lote_insert() IS 
  'Reserva ID do laudo (igual ao lote) em status rascunho ao criar lote. Status rascunho permite criar sem hash_pdf, evitando erro de validação.';

COMMIT;

-- Rollback (se necessário):
-- BEGIN;
-- CREATE OR REPLACE FUNCTION fn_reservar_id_laudo_on_lote_insert() RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO laudos (id, lote_id) VALUES (NEW.id, NEW.id) ON CONFLICT (id) DO NOTHING;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- COMMIT;
