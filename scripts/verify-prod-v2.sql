-- ====================================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO: neondb_v2
-- Executar: psql -h <host> -U neondb_owner -d neondb_v2 -f verify-prod-v2.sql
-- ====================================================================

\echo '=== VERIFICAÇÃO PÓS-MIGRAÇÃO neondb_v2 ==='
\echo ''

-- 1. Contagens de tabelas críticas
\echo '--- 1. Contagens de dados (comparar com PROD original) ---'
SELECT 'clinicas' AS tabela, count(*) AS total, 19 AS esperado, CASE WHEN count(*) = 19 THEN 'OK' ELSE 'DIVERGENTE' END AS status FROM clinicas
UNION ALL SELECT 'entidades', count(*), 14, CASE WHEN count(*) = 14 THEN 'OK' ELSE 'DIVERGENTE' END FROM entidades
UNION ALL SELECT 'empresas_clientes', count(*), 20, CASE WHEN count(*) = 20 THEN 'OK' ELSE 'DIVERGENTE' END FROM empresas_clientes
UNION ALL SELECT 'funcionarios', count(*), 124, CASE WHEN count(*) = 124 THEN 'OK' ELSE 'DIVERGENTE' END FROM funcionarios
UNION ALL SELECT 'avaliacoes', count(*), 148, CASE WHEN count(*) = 148 THEN 'OK' ELSE 'DIVERGENTE' END FROM avaliacoes
UNION ALL SELECT 'respostas', count(*), 3173, CASE WHEN count(*) = 3173 THEN 'OK' ELSE 'DIVERGENTE' END FROM respostas
UNION ALL SELECT 'lotes_avaliacao', count(*), 56, CASE WHEN count(*) = 56 THEN 'OK' ELSE 'DIVERGENTE' END FROM lotes_avaliacao
UNION ALL SELECT 'laudos', count(*), 45, CASE WHEN count(*) = 45 THEN 'OK' ELSE 'DIVERGENTE' END FROM laudos
UNION ALL SELECT 'contratos', count(*), 34, CASE WHEN count(*) = 34 THEN 'OK' ELSE 'DIVERGENTE' END FROM contratos
UNION ALL SELECT 'pagamentos', count(*), 36, CASE WHEN count(*) = 36 THEN 'OK' ELSE 'DIVERGENTE' END FROM pagamentos
UNION ALL SELECT 'usuarios', count(*), 32, CASE WHEN count(*) = 32 THEN 'OK' ELSE 'DIVERGENTE' END FROM usuarios
ORDER BY tabela;

\echo ''

-- 2. Colunas legacy que NÃO devem existir
\echo '--- 2. Colunas legacy (devem estar AUSENTES) ---'
SELECT table_name, column_name, 'PROBLEMA: coluna legacy existe!' AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'clinicas'        AND column_name IN ('pagamento_confirmado','data_liberacao_login','plano_id'))
    OR (table_name = 'entidades'    AND column_name IN ('pagamento_confirmado','data_liberacao_login','plano_id'))
    OR (table_name = 'contratos'    AND column_name IN ('plano_id','valor_personalizado'))
    OR (table_name = 'lotes_avaliacao' AND column_name = 'contratante_id')
  );

\echo ''

-- 3. Tabelas legacy que NÃO devem existir
\echo '--- 3. Tabelas legacy (devem estar AUSENTES) ---'
SELECT tablename AS tabela, 'PROBLEMA: tabela legacy existe!' AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('contratos_planos','payment_links','confirmacao_identidade');

\echo ''

-- 4. schema_migrations
\echo '--- 4. schema_migrations ---'
SELECT count(*) AS total_versoes,
       max(version) AS ultima_versao,
       CASE WHEN max(version) >= 1143 THEN 'OK' ELSE 'DESATUALIZADA' END AS status
FROM schema_migrations;

\echo ''

-- 5. Views críticas
\echo '--- 5. Views criticas ---'
SELECT table_name AS view_name, 'OK' AS status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('tomadores','gestores','v_solicitacoes_emissao','v_relatorio_emissoes')
ORDER BY table_name;

\echo ''

-- 6. Functions críticas
\echo '--- 6. Functions criticas ---'
SELECT routine_name, 'OK' AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('fn_next_lote_id','fn_set_session_context','fn_check_clinica_access','fn_check_entidade_access')
ORDER BY routine_name;

\echo ''

-- 7. RLS policies
\echo '--- 7. RLS policies ---'
SELECT count(*) AS total_policies FROM pg_policies;

\echo ''

-- 8. FKs não-validadas
\echo '--- 8. Foreign keys nao-validadas ---'
SELECT conname AS fk_name, conrelid::regclass AS table_name, 'NAO VALIDADA' AS status
FROM pg_constraint
WHERE contype = 'f' AND NOT convalidated;

\echo ''

-- 9. Sequences sync check
\echo '--- 9. Sequences (id deve ser >= max(id) da tabela) ---'
SELECT
  t.table_name,
  pg_get_serial_sequence(t.table_name, 'id') AS sequence_name,
  currval(pg_get_serial_sequence(t.table_name, 'id')) AS seq_current
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND pg_get_serial_sequence(t.table_name, 'id') IS NOT NULL
  AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'id')
ORDER BY t.table_name;

\echo ''

-- 10. ENUMs
\echo '--- 10. ENUMs definidos ---'
SELECT t.typname AS enum_name, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS values
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typtype = 'e'
GROUP BY t.typname
ORDER BY t.typname;

\echo ''
\echo '=== VERIFICAÇÃO CONCLUÍDA ==='
