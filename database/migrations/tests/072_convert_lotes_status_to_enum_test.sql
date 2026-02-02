-- Migration 072: Converte coluna lotes_avaliacao.status para enum status_lote no banco de teste
-- Data: 2026-01-05

BEGIN;

-- Remover default temporariamente
ALTER TABLE IF EXISTS lotes_avaliacao ALTER COLUMN status DROP DEFAULT;

-- Tentar converter para status_lote
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_lote') THEN
    BEGIN
      -- Tenta alteração; se falhar, registra mensagem e não aborta todo o processo
      ALTER TABLE lotes_avaliacao ALTER COLUMN status TYPE status_lote USING status::status_lote;
      -- Reaplicar default compatível
      ALTER TABLE lotes_avaliacao ALTER COLUMN status SET DEFAULT 'rascunho'::status_lote;
      RAISE NOTICE 'Coluna lotes_avaliacao.status convertida para status_lote com DEFAULT reaplicado.';
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Falha ao converter lotes_avaliacao.status para status_lote: %', SQLERRM;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;
