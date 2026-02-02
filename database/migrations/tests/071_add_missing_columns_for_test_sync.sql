-- Migration 071: Adiciona colunas faltantes e corrige tipo de status em lotes_avaliacao (aplicar apenas no banco de teste se necessário)
-- Data: 2026-01-05

BEGIN;

-- Adiciona modo_emergencia, motivo_emergencia e processamento_em se ausentes
ALTER TABLE IF EXISTS lotes_avaliacao
  ADD COLUMN IF NOT EXISTS modo_emergencia BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS motivo_emergencia TEXT,
  ADD COLUMN IF NOT EXISTS processamento_em TIMESTAMP;

-- Garante que o tipo status seja status_lote (se já existir o tipo)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_lote') THEN
    -- Se a coluna já for status_lote, o alter será ignorado. Use USING para converter texto para enum quando possível
    BEGIN
      ALTER TABLE lotes_avaliacao ALTER COLUMN status TYPE status_lote USING status::status_lote;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Não foi possível converter lotes_avaliacao.status para status_lote automaticamente: %', SQLERRM;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Garantir compatibilidade para testes que usam 'questao' ao invés de 'item'
ALTER TABLE IF EXISTS respostas
  ADD COLUMN IF NOT EXISTS questao INTEGER;

-- Se houver 'item' e não existir 'questao' podemos popular temporariamente para compatibilidade (apenas se for seguro)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='respostas' AND column_name='item')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='respostas' AND column_name='questao') THEN
    -- Tentar converter items numéricos para questao quando possível
    UPDATE respostas SET questao = (CASE WHEN item ~ '^[0-9]+$' THEN item::integer ELSE NULL END) WHERE questao IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT '071.1 Colunas adicionadas e tipo status ajustado (quando possível)' as status;

COMMIT;
