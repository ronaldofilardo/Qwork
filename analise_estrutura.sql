-- Analisar estrutura de funcionarios_clinicas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'funcionarios_clinicas'
ORDER BY ordinal_position;

-- Analisar colunas contratante em qualquer tabela
SELECT DISTINCT
  table_name,
  column_name
FROM information_schema.columns
WHERE column_name LIKE '%contratante%' OR column_name LIKE '%clinica%' OR column_name LIKE '%empresa%'
ORDER BY table_name, column_name;
