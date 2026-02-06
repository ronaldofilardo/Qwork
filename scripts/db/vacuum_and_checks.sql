-- scripts/db/vacuum_and_checks.sql
-- Descrição: Executa VACUUM (VERBOSE, ANALYZE) nas tabelas principais e faz verificações de contagem e RLS.
-- Uso: psql "postgresql://postgres:123456@localhost:5432/nr-bps_db" -f scripts/db/vacuum_and_checks.sql

\set ON_ERROR_STOP on

-- Garantir encoding UTF8 para evitar erros de exibição no Windows terminal
SET client_encoding = 'UTF8';

-- ==================================================================
-- VACUUM nas tabelas-chave (pode demorar dependendo do tamanho)
-- ==================================================================
\echo 'Running VACUUM (VERBOSE, ANALYZE) on target tables...'
VACUUM (VERBOSE, ANALYZE) laudos;
VACUUM (VERBOSE, ANALYZE) avaliacoes;
VACUUM (VERBOSE, ANALYZE) lotes_avaliacao;
VACUUM (VERBOSE, ANALYZE) resultados;

-- Tabelas que foram afetadas por cascade (limpeza preventiva)
VACUUM (VERBOSE, ANALYZE) funcionarios;
VACUUM (VERBOSE, ANALYZE) fila_emissao;
VACUUM (VERBOSE, ANALYZE) notificacoes_admin;
VACUUM (VERBOSE, ANALYZE) emissao_queue;
VACUUM (VERBOSE, ANALYZE) analise_estatistica;

\echo 'VACUUM completed.'

-- ==================================================================
-- Verificações pós-VACUUM: contagens e status de RLS
-- ==================================================================
\echo 'Checking table counts...'
SELECT 'laudos' AS tabela, COUNT(*) FROM laudos;
SELECT 'avaliacoes' AS tabela, COUNT(*) FROM avaliacoes;
SELECT 'lotes_avaliacao' AS tabela, COUNT(*) FROM lotes_avaliacao;
SELECT 'resultados' AS tabela, COUNT(*) FROM resultados;
SELECT 'funcionarios' AS tabela, COUNT(*) FROM funcionarios;
SELECT 'fila_emissao' AS tabela, COUNT(*) FROM fila_emissao;
SELECT 'notificacoes_admin' AS tabela, COUNT(*) FROM notificacoes_admin;
SELECT 'emissao_queue' AS tabela, COUNT(*) FROM emissao_queue;
SELECT 'analise_estatistica' AS tabela, COUNT(*) FROM analise_estatistica;

\echo 'Checking RLS status for relevant tables...'
SELECT c.relname AS tabela, c.relrowsecurity AS rls
FROM pg_class c
WHERE c.relname IN ('laudos','avaliacoes','lotes_avaliacao','resultados','funcionarios','fila_emissao');

-- ==================================================================
-- Sanity checks: verificar sequences (ids reiniciados após RESTART IDENTITY)
-- ==================================================================
\echo 'Checking serial sequences (last_value where applicable)...'
-- Usar pg_sequences para obter last_value (disponível em Postgres moderno)
-- Note: pg_sequences columns são "schemaname", "sequencename", "last_value".
SELECT sequencename AS sequence_name, last_value FROM pg_sequences WHERE sequencename IN (
  'laudos_id_seq',
  'avaliacoes_id_seq',
  'lotes_avaliacao_id_seq'
);

\echo 'Script finished.'
