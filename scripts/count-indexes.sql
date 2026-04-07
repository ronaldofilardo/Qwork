-- Verificar índices por tabela
SELECT tablename, count(*) AS idx_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
