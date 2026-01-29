-- Migração: Implementar alocador transacional de IDs para lotes (garante ids sequenciais sem gaps)
-- Data: 2026-01-28

BEGIN;

-- 1) Criar tabela de alocador (apenas 1 linha será usada)
CREATE TABLE IF NOT EXISTS lote_id_allocator (
  last_id bigint NOT NULL
);

-- 2) Inicializar o alocador com o valor máximo atual de lotes (ou 0 se nenhum)
INSERT INTO lote_id_allocator (last_id)
SELECT COALESCE(MAX(id), 0) FROM lotes_avaliacao
ON CONFLICT DO NOTHING;

-- 3) Função que retorna o próximo id de lote de forma atômica
CREATE OR REPLACE FUNCTION fn_next_lote_id()
RETURNS bigint AS $$
DECLARE
  v_next bigint;
BEGIN
  UPDATE lote_id_allocator
  SET last_id = last_id + 1
  RETURNING last_id INTO v_next;

  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- 4) Garantir que o id do lote seja atribuído via DEFAULT chamando a função
ALTER TABLE lotes_avaliacao ALTER COLUMN id SET DEFAULT fn_next_lote_id();

-- 5) Sincronizar sequência de laudos para o novo contador (caso exista)
--    Ajusta laudos_id_seq para evitar colisões ao inserir diretamente com nextval
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'laudos_id_seq') THEN
    PERFORM setval('laudos_id_seq', (SELECT last_id FROM lote_id_allocator), true);
  END IF;
END;
$$;

COMMIT;

-- Rollback manual (se necessário):
-- BEGIN;
-- ALTER TABLE lotes_avaliacao ALTER COLUMN id SET DEFAULT nextval('lotes_avaliacao_id_seq');
-- DROP FUNCTION IF EXISTS fn_next_lote_id();
-- DROP TABLE IF EXISTS lote_id_allocator;
-- COMMIT;
