-- Comparação de colunas entre bancos (executar em neondb_v2 com dblink para neondb_staging)
-- Para uso local: exportar de cada banco e comparar

-- 1. Contagem de colunas por tabela
\echo '=== COLUNAS POR TABELA ==='
SELECT table_name, count(*) AS total_cols
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- 2. Colunas legacy que DEVEM estar ausentes
\echo ''
\echo '=== COLUNAS LEGACY (devem estar AUSENTES - 0 rows = OK) ==='
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'clinicas'          AND column_name IN ('pagamento_confirmado','data_liberacao_login','plano_id'))
    OR (table_name = 'entidades'      AND column_name IN ('pagamento_confirmado','data_liberacao_login','plano_id'))
    OR (table_name = 'contratos'      AND column_name IN ('plano_id','valor_personalizado'))
    OR (table_name = 'lotes_avaliacao' AND column_name = 'contratante_id')
  );

-- 3. FK emissor_cpf removida  
\echo ''
\echo '=== FK EMISSOR_CPF (deve estar AUSENTE - 0 rows = OK) ==='
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE table_name = 'laudos'
  AND constraint_name LIKE '%emissor_cpf%';

-- 4. Contagens de dados críticos
\echo ''
\echo '=== CONTAGENS DE DADOS ==='
SELECT 'clinicas' AS tabela, count(*) AS total FROM clinicas
UNION ALL SELECT 'entidades', count(*) FROM entidades
UNION ALL SELECT 'funcionarios', count(*) FROM funcionarios
UNION ALL SELECT 'avaliacoes', count(*) FROM avaliacoes
UNION ALL SELECT 'lotes_avaliacao', count(*) FROM lotes_avaliacao
UNION ALL SELECT 'laudos', count(*) FROM laudos
UNION ALL SELECT 'usuarios', count(*) FROM usuarios
UNION ALL SELECT 'contratos', count(*) FROM contratos
ORDER BY tabela;

-- 5. Últimas migrations
\echo ''
\echo '=== ÚLTIMAS 10 MIGRATIONS ==='
SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 10;

-- 6. Views críticas
\echo ''
\echo '=== VIEWS CRÍTICAS ==='
SELECT table_name AS view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- 7. Índices
\echo ''
\echo '=== ÍNDICES (count) ==='
SELECT count(*) AS total_indexes FROM pg_indexes WHERE schemaname = 'public';
