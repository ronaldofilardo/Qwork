-- Debug script: Find all views referencing laudos in staging
SELECT 
  schemaname, 
  viewname,
  LEFT(definition, 200) AS definition_preview
FROM pg_views 
WHERE definition LIKE '%laudos%' 
  AND schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY viewname;
