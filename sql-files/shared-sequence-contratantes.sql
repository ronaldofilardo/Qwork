-- ================================================================
-- SPRINT 0: SEQUENCE Compartilhada para IDs de Contratantes
-- Data: 2026-02-06T18:35:22.025Z
-- ================================================================
-- OBJETIVO: Clínicas e Entidades compartilham sequência de IDs
-- SEM BURACOS, como se fossem uma única tabela "contratantes"
-- ================================================================

BEGIN;

-- ================================================================
-- 1. Criar SEQUENCE compartilhada
-- ================================================================

CREATE SEQUENCE IF NOT EXISTS seq_contratantes_id
  START WITH 38
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

COMMENT ON SEQUENCE seq_contratantes_id IS 'Sequência compartilhada para IDs de entidades e clínicas (contratantes independentes)';

-- ================================================================
-- 2. Ajustar sequences existentes (se existirem)
-- ================================================================

-- Desativar sequences antigas se existirem
DO $$ 
BEGIN
  -- Remover default da sequence antiga de entidades
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'entidades_id_seq') THEN
    ALTER TABLE entidades ALTER COLUMN id DROP DEFAULT;
  END IF;
  
  -- Remover default da sequence antiga de clinicas
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'clinicas_id_seq') THEN
    ALTER TABLE clinicas ALTER COLUMN id DROP DEFAULT;
  END IF;
END $$;

-- ================================================================
-- 3. Configurar colunas para usar SEQUENCE compartilhada
-- ================================================================

-- Entidades usam a sequence compartilhada
ALTER TABLE entidades 
  ALTER COLUMN id SET DEFAULT nextval('seq_contratantes_id');

-- Clínicas usam a sequence compartilhada
ALTER TABLE clinicas 
  ALTER COLUMN id SET DEFAULT nextval('seq_contratantes_id');

-- ================================================================
-- 4. Ajustar valor atual da sequence
-- ================================================================

-- Garantir que a sequence esteja no próximo valor após o maior ID
SELECT setval('seq_contratantes_id', 
  GREATEST(
    COALESCE((SELECT MAX(id) FROM entidades), 0),
    COALESCE((SELECT MAX(id) FROM clinicas), 0)
  ), 
  true
);

-- ================================================================
-- 5. Criar função helper para inserções manuais
-- ================================================================

CREATE OR REPLACE FUNCTION get_next_contratante_id()
RETURNS INTEGER AS $$
BEGIN
  RETURN nextval('seq_contratantes_id');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_contratante_id() IS 'Retorna o próximo ID disponível para entidades/clínicas';

COMMIT;

-- ================================================================
-- VALIDAÇÃO: Testar sequence compartilhada
-- ================================================================

-- Verificar configuração das colunas
SELECT 
  'entidades' as tabela,
  column_name,
  column_default
FROM information_schema.columns
WHERE table_name = 'entidades' AND column_name = 'id'
UNION ALL
SELECT 
  'clinicas' as tabela,
  column_name,
  column_default
FROM information_schema.columns
WHERE table_name = 'clinicas' AND column_name = 'id';

-- Verificar valor atual da sequence
SELECT 
  last_value as current_value,
  is_called
FROM seq_contratantes_id;
