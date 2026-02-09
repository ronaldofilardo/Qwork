-- Adicionar coluna tipo_tomador à tabela contratos
-- Executar via: psql -U postgres -d nr-bps_db_test -h localhost -f database/migrations/_force_add_tipo_tomador.sql

-- 1. Verificar se a coluna já existe
SELECT CASE 
  WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contratos' AND column_name = 'tipo_tomador'
  ) THEN 'Coluna tipo_tomador JÁ EXISTE. Pulando...'
  ELSE 'Coluna tipo_tomador NÃO EXISTE. Criando...'
END AS status;

-- 2. Adicionar coluna (sim ou não, dependendo resultado acima)
-- Se der erro "column already exists", significa que foi bien criada

BEGIN;

ALTER TABLE contratos 
ADD COLUMN tipo_tomador VARCHAR(50) DEFAULT 'entidade';

-- Criar índice
CREATE INDEX idx_contratos_tipo_tomador ON contratos(tipo_tomador);

-- Adicionar comentário
COMMENT ON COLUMN contratos.tipo_tomador IS 'Tipo do tomador: entidade ou clinica - usado para buscar na tabela correta';

COMMIT;

-- 3. Verificar que foi criada
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'contratos' AND column_name = 'tipo_tomador';

-- 4. Log de sucesso
SELECT '✓ Coluna tipo_tomador criada com sucesso!' AS resultado;
