-- scripts/db/reset_all_funcionarios_nunca_avaliado.sql
-- Descrição: Atualiza TODOS os funcionários para o estado "nunca avaliado".
-- Uso seguro: por padrão faz apenas PREVIEW e DRY-RUN (BEGIN ... ROLLBACK).
-- Para executar de fato, setar a variável psql EXECUTE_REAL para 'true' antes de rodar.
-- Ex: psql "postgresql://postgres:123456@localhost:5432/nr-bps_db" -v EXECUTE_REAL=true -f scripts/db/reset_all_funcionarios_nunca_avaliado.sql

\set ON_ERROR_STOP on
-- EXECUTE_REAL undefined by default. Set when you want to run for real:
-- psql -v EXECUTE_REAL=1 -f scripts/db/reset_all_funcionarios_nunca_avaliado.sql

-- Garantir encoding
SET client_encoding = 'UTF8';

-- PREVIEW: mostrar contagens e amostra
\echo '=== PREVIEW: contagens e amostra (antes) ==='
SELECT 'funcionarios_total' AS tag, COUNT(*) FROM funcionarios;
SELECT id, cpf, nome, indice_avaliacao, data_ultimo_lote, ativo FROM funcionarios LIMIT 20;

-- DRY-RUN (simulação)
\echo '=== DRY-RUN (BEGIN; UPDATE ...; ROLLBACK) ==='
BEGIN;
-- Atualiza todos (simulação)
UPDATE funcionarios
SET indice_avaliacao = 0,
    data_ultimo_lote = NULL,
    atualizado_em = NOW();

-- Mostrar quantos ficariam com indice_avaliacao = 0
SELECT 'simulated_updated' AS tag, COUNT(*) FROM funcionarios WHERE indice_avaliacao = 0;

-- Inserir entrada de auditoria simulada (não persistirá)
-- Usar DO + EXECUTE para evitar erro de parse se colunas não existirem
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name IN (
        'acao','entidade','entidade_id','dados','user_id','user_role','criado_em')) = 7 THEN
    EXECUTE $ins$
      INSERT INTO audit_logs (acao, entidade, entidade_id, dados, user_id, user_role, criado_em)
      SELECT 'reset_para_nunca_avaliado_simulacao', 'funcionarios', NULL,
             jsonb_build_object('descricao','simulacao: reset all para nunca avaliado','total_afetados', (SELECT COUNT(*) FROM funcionarios)),
             NULL, 'sistema', NOW();
    $ins$;
  END IF;
END
$$;

-- Verificação dentro do DRY-RUN
SELECT id, cpf, nome, indice_avaliacao, data_ultimo_lote FROM funcionarios LIMIT 5;
ROLLBACK;

\echo 'DRY-RUN completo. Para executar de fato, rode o script com psql -v EXECUTE_REAL=true ...'

-- EXECUÇÃO REAL (somente se EXECUTE_REAL=true)
\if :{?EXECUTE_REAL}
\echo '=== EXECUTANDO ATUALIZAÇÃO REAL ==='
-- Opcional: desabilitar RLS temporariamente para garantir que UPDATE será permitido
ALTER TABLE IF EXISTS public.funcionarios DISABLE ROW LEVEL SECURITY;

BEGIN;
-- Atualização real
UPDATE funcionarios
SET indice_avaliacao = 0,
    data_ultimo_lote = NULL,
    atualizado_em = NOW();

-- Inserir um único registro de auditoria resumido
-- Usar DO + EXECUTE para evitar erro de parse se colunas não existirem
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name IN (
        'acao','entidade','entidade_id','dados','user_id','user_role','criado_em')) = 7 THEN
    EXECUTE $ins$
      INSERT INTO audit_logs (acao, entidade, entidade_id, dados, user_id, user_role, criado_em)
      SELECT 'reset_para_nunca_avaliado', 'funcionarios', NULL,
             jsonb_build_object('descricao', 'Reset all funcionarios to nunca avaliado', 'total_afetados', (SELECT COUNT(*) FROM funcionarios), 'usuario', current_user),
             NULL, 'sistema', NOW();
    $ins$;
  END IF;
END
$$;

COMMIT;

-- Reabilitar RLS
ALTER TABLE IF EXISTS public.funcionarios ENABLE ROW LEVEL SECURITY;

\echo 'EXECUÇÃO REAL completa.'
\else
\echo 'EXECUÇÃO REAL não habilitada. Nada foi modificado.'
\endif

-- Pós-verificação
\echo '=== PÓS: contagens e amostra (depois) ==='
SELECT 'funcionarios_total' AS tag, COUNT(*) FROM funcionarios;
SELECT id, cpf, nome, indice_avaliacao, data_ultimo_lote, ativo FROM funcionarios LIMIT 20;

\echo 'Script finalizado.'
