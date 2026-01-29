-- Migração: tornar fn_reservar_id_laudo_on_lote_insert compatível com diferentes checagens de status
-- Data: 2026-01-28

BEGIN;

CREATE OR REPLACE FUNCTION fn_reservar_id_laudo_on_lote_insert()
RETURNS trigger AS $$
DECLARE
  v_def text;
  v_status text := 'rascunho';
BEGIN
  -- Detectar se a constraint de status permite 'rascunho'; caso contrário, usar 'enviado'
  SELECT pg_get_constraintdef(oid) INTO v_def
  FROM pg_constraint
  WHERE conrelid = 'laudos'::regclass AND contype = 'c' AND conname LIKE 'laudos_status%';

  IF v_def IS NULL OR position('rascunho' IN v_def) = 0 THEN
    v_status := 'enviado';
  END IF;

  INSERT INTO laudos (id, lote_id, emissor_cpf, status, criado_em, atualizado_em)
  VALUES (NEW.id, NEW.id, '00000000000', v_status, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Rollback manual (se necessário):
-- BEGIN; CREATE OR REPLACE FUNCTION fn_reservar_id_laudo_on_lote_insert() ... (restore previous version); COMMIT;
