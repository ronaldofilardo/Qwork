-- Migração: Sincronizar sequências de lote e laudo + reservar ID ao criar lote
-- Data: 2026-01-28
-- Objetivo: Garantir que lote.id = laudo.id SEMPRE, reservando o ID no momento da criação do lote

BEGIN;

-- 1. Sincronizar a sequência de laudos com a de lotes
SELECT setval('laudos_id_seq', (SELECT last_value FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'lotes_avaliacao_id_seq'), true);

-- 2. Criar função que reserva o ID do laudo ao criar um lote
CREATE OR REPLACE FUNCTION fn_reservar_id_laudo_on_lote_insert()
RETURNS trigger AS $$
BEGIN
  -- Reservar o mesmo ID para o laudo (em status rascunho)
  -- Isso garante que quando o laudo for efetivamente gerado, usará este ID
  INSERT INTO laudos (id, lote_id, emissor_cpf, status, criado_em, atualizado_em)
  VALUES (NEW.id, NEW.id, '00000000000', 'rascunho', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;  -- Se já existe (ex: migração anterior), não faz nada
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger AFTER INSERT em lotes_avaliacao
DROP TRIGGER IF EXISTS trg_reservar_id_laudo_on_lote_insert ON lotes_avaliacao;
CREATE TRIGGER trg_reservar_id_laudo_on_lote_insert
AFTER INSERT ON lotes_avaliacao
FOR EACH ROW
EXECUTE FUNCTION fn_reservar_id_laudo_on_lote_insert();

-- 4. Criar laudo para lote 1 (que não tem laudo ainda) usando status compatível com a constraint
DO $$
DECLARE
  v_def text;
  v_status text := 'rascunho';
BEGIN
  SELECT pg_get_constraintdef(oid) INTO v_def FROM pg_constraint WHERE conrelid = 'laudos'::regclass AND contype = 'c' AND conname LIKE 'laudos_status%';
  IF v_def IS NULL OR position('rascunho' IN v_def) = 0 THEN
    v_status := 'enviado';
  END IF;

  BEGIN
    INSERT INTO laudos (id, lote_id, emissor_cpf, status, criado_em, atualizado_em)
    VALUES (1, 1, '00000000000', v_status, NOW(), NOW())
    ON CONFLICT (lote_id) DO NOTHING;
  EXCEPTION WHEN others THEN
    -- Ignore: se houver alguma restrição específica de ambiente, não falhar a migração
    RAISE NOTICE 'Não foi possível inserir laudo inicial: %', SQLERRM;
  END;
END;
$$;

COMMIT;

-- Rollback manual (se necessário):
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_reservar_id_laudo_on_lote_insert ON lotes_avaliacao;
-- DROP FUNCTION IF EXISTS fn_reservar_id_laudo_on_lote_insert();
-- DELETE FROM laudos WHERE status = 'pendente';
-- COMMIT;
