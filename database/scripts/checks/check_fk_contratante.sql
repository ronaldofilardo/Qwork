-- Verificar Foreign Keys em contratante_id
SELECT 
  t.relname as table_name,
  a.attname as column_name,
  rc.relname as referenced_table
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_attribute a ON a.attnum = c.conkey[1] AND a.attrelid = t.oid
JOIN pg_class rc ON c.confrelid = rc.oid
WHERE c.contype = 'f' AND a.attname = 'contratante_id'
ORDER BY t.relname;
