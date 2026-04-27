-- ====================================================================
-- VERIFICAÇÃO PÓS-SYNC: neondb_staging deve estar igual a neondb_v2
-- Data: 24/04/2026
-- Branch: feature/v2
-- ====================================================================
-- Execute contra neondb_staging:
--   psql "postgresql://neondb_owner:PASS@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_staging?sslmode=require" \
--        -f scripts/verify-staging-sync.sql
-- ====================================================================

\echo ''
\echo '==================================================================='
\echo '  VERIFICAÇÃO PÓS-SYNC — neondb_staging'
\echo '==================================================================='
\echo ''

-- ============================================================
-- [1] Schema migrations: max deve ser >= 1203
-- ============================================================
\echo '[1/9] Schema migrations (max esperado >= 1203):'
SELECT
    MAX(version) FILTER (WHERE version < 9000) AS max_normal,
    MAX(version) FILTER (WHERE version >= 9000) AS max_special,
    COUNT(*) AS total_migrations
FROM schema_migrations;

SELECT version
FROM schema_migrations
WHERE version IN (1146, 1147, 1148, 1200, 1201, 1202, 1203)
ORDER BY version;

\echo ''

-- ============================================================
-- [2] Row counts de tabelas críticas
-- ============================================================
\echo '[2/9] Row counts (confirmar que nao esta zerado):'
SELECT
    'clinicas'           AS tabela, count(*) AS rows FROM clinicas        UNION ALL
    SELECT 'entidades',           count(*)  FROM entidades                UNION ALL
    SELECT 'empresas_clientes',   count(*)  FROM empresas_clientes        UNION ALL
    SELECT 'funcionarios',        count(*)  FROM funcionarios             UNION ALL
    SELECT 'lotes_avaliacao',     count(*)  FROM lotes_avaliacao          UNION ALL
    SELECT 'avaliacoes',          count(*)  FROM avaliacoes               UNION ALL
    SELECT 'respostas',           count(*)  FROM respostas                UNION ALL
    SELECT 'laudos',              count(*)  FROM laudos                   UNION ALL
    SELECT 'contratos',           count(*)  FROM contratos                UNION ALL
    SELECT 'pagamentos',          count(*)  FROM pagamentos               UNION ALL
    SELECT 'usuarios',            count(*)  FROM usuarios                 UNION ALL
    SELECT 'representantes',      count(*)  FROM representantes
ORDER BY 1;

\echo ''

-- ============================================================
-- [3] Colunas legacy NÃO devem existir (deve retornar 0 rows)
-- ============================================================
\echo '[3/9] Colunas legacy (deve retornar 0 rows — schema limpo):'
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('pagamento_confirmado', 'data_liberacao_login', 'plano_id', 'valor_personalizado')
  AND table_name IN ('clinicas', 'entidades', 'contratos', 'lotes_avaliacao')
ORDER BY table_name, column_name;

\echo ''

-- ============================================================
-- [4] Tabelas novas de 1147/1200/1202 existem
-- ============================================================
\echo '[4/9] Tabelas novas (devem existir):'
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('rate_limit_entries', 'creditos_manutencao', 'audit_delecoes_tomador')
ORDER BY table_name;

\echo ''

-- ============================================================
-- [5] Colunas novas de 1200 em entidades/clinicas/empresas/pagamentos
-- ============================================================
\echo '[5/9] Colunas novas de migration 1200-1203:'
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'entidades'           AND column_name IN ('limite_primeira_cobranca_manutencao','manutencao_ja_cobrada','credito_manutencao_pendente'))
    OR (table_name = 'clinicas'         AND column_name IN ('credito_manutencao_pendente'))
    OR (table_name = 'empresas_clientes' AND column_name IN ('limite_primeira_cobranca_manutencao','manutencao_ja_cobrada'))
    OR (table_name = 'pagamentos'       AND column_name IN ('tipo_cobranca','empresa_id','link_pagamento_token','link_pagamento_enviado_em','link_disponibilizado_em'))
    OR (table_name = 'representantes'   AND column_name = 'percentual_comissao_comercial')
    OR (table_name = 'leads_representante' AND column_name = 'percentual_comissao_comercial')
    OR (table_name = 'representantes_cadastro_leads' AND column_name = 'asaas_wallet_id')
  )
ORDER BY table_name, column_name;

\echo ''

-- ============================================================
-- [6] Sequences sincronizadas (nextval >= max(id))
-- ============================================================
\echo '[6/9] Sequences (nextval deve ser >= MAX(id) de cada tabela):'
SELECT
    t.tablename,
    pg_get_serial_sequence('public.' || t.tablename, 'id') AS sequence_name,
    last_value AS seq_current
FROM pg_tables t
JOIN pg_sequences s
    ON s.sequencename = replace(pg_get_serial_sequence('public.' || t.tablename, 'id'), 'public.', '')
WHERE t.schemaname = 'public'
  AND pg_get_serial_sequence('public.' || t.tablename, 'id') IS NOT NULL
ORDER BY t.tablename
LIMIT 20;

\echo ''

-- ============================================================
-- [7] Views críticas existem
-- ============================================================
\echo '[7/9] Views criticas:'
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('tomadores', 'gestores', 'v_solicitacoes_emissao', 'v_relatorio_emissoes')
ORDER BY table_name;

\echo ''

-- ============================================================
-- [8] FKs válidas (não-validadas seriam sinal de problema)
-- ============================================================
\echo '[8/9] FKs nao-validadas (deve retornar 0 rows):'
SELECT conname, conrelid::regclass AS tabela
FROM pg_constraint
WHERE contype = 'f'
  AND NOT convalidated
ORDER BY tabela;

\echo ''

-- ============================================================
-- [9] Dados de representantes com nova coluna (sanity check)
-- ============================================================
\echo '[9/9] Representantes: percentual_comissao_comercial (todas devem ter valor >= 0):'
SELECT
    COUNT(*) AS total_representantes,
    COUNT(*) FILTER (WHERE percentual_comissao_comercial IS NULL) AS com_null,
    MIN(percentual_comissao_comercial) AS min_pct,
    MAX(percentual_comissao_comercial) AS max_pct,
    AVG(percentual_comissao_comercial) AS avg_pct
FROM representantes;

\echo ''
\echo '==================================================================='
\echo '  FIM DA VERIFICAÇÃO'
\echo '  Resultados esperados:'
\echo '    [1] max_normal >= 1203'
\echo '    [2] rows > 0 em tabelas criticas'
\echo '    [3] 0 rows (sem colunas legacy)'
\echo '    [4] 3 rows (rate_limit_entries, creditos_manutencao, audit_delecoes_tomador)'
\echo '    [5] todas as colunas novas presentes'
\echo '    [6] seq_current >= max(id) por tabela'
\echo '    [7] 4 views criticas presentes'
\echo '    [8] 0 rows (sem FKs invalidas)'
\echo '    [9] com_null = 0'
\echo '==================================================================='
\echo ''
