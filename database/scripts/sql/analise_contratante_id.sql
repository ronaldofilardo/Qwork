-- ===================================================================
-- ANÁLISE: Remover contratante_id de funcionarios_entidades
-- Banco: nr-bps_db (PRODUÇÃO)
-- ===================================================================

-- 1. Informações da coluna
SELECT 
  table_name,
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'funcionarios_entidades' AND column_name = 'contratante_id';

-- 2. Constraints (FK) na tabela funcionarios_entidades
SELECT 
  constraint_name,
  table_name,
  column_name,
  is_deferrable,
  initially_deferred
FROM information_schema.key_column_usage
WHERE table_name = 'funcionarios_entidades'
ORDER BY constraint_name;

-- 3. ForeignKey constraints (aqueles que referem contratante_id)
SELECT 
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.referential_constraints
WHERE table_name = 'funcionarios_entidades'
ORDER BY constraint_name;

-- 4. Dados: QuantasRows tem na tabela?
SELECT COUNT(*) as total_rows FROM funcionarios_entidades;

-- 5. Valores não-NULL em contratante_id
SELECT COUNT(*) as non_null_count 
FROM funcionarios_entidades 
WHERE contratante_id IS NOT NULL;

-- 6. Se houver tomador_id, quanto está preenchido?
SELECT 
  COUNT(*) as total_rows,
  COUNT(tomador_id) as tomador_id_not_null,
  COUNT(contratante_id) as contratante_id_not_null
FROM funcionarios_entidades;

-- 7. Dados amostra: primeiras 5 rows
SELECT id, entidade_id, contratante_id, tomador_id 
FROM funcionarios_entidades 
LIMIT 5;

-- 8. Verificar se há Views que usam funcionarios_entidades
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE '%funcionario%';

-- 9. Constraints de Foreign Key que referem funcionarios_entidades
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'funcionarios_entidades'
ORDER BY tc.constraint_name;
