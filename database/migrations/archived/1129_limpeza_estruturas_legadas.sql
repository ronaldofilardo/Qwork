-- =============================================================================
-- Migration 1129: Limpeza de Estruturas Legadas
-- Data: 2026-03-26
-- Objetivo: Remover tabelas, colunas, triggers e funções legadas que foram
--           identificadas como incompatíveis com o fluxo atual do sistema.
--
-- CONTEXTO:
--   - Migration 533 devia ter dropado planos/contratos_planos mas não completou
--   - Migration 1012_rollback removeu confirmacao_identidade (já dropada)
--   - Migration 1016/1017 renomeou contratante_id → entidade_id/tomador_id
--   - Diagrama arquitetural confirma: sem sistema de "Plano", pagamento por lote
--
-- ORDEM: CASCADE usado para garantir remoção de dependências automaticamente
-- =============================================================================

BEGIN;

-- =============================================================================
-- FASE 1: Remover trigger e função BUGADA da contratacao_personalizada
-- (Referenciava tabela `contratantes` que foi renomeada para `entidades`)
-- =============================================================================

DROP TRIGGER IF EXISTS sync_personalizado_status_trg ON public.contratacao_personalizada;
DROP FUNCTION IF EXISTS public.sync_personalizado_status() CASCADE;

-- =============================================================================
-- FASE 2: Remover sistema de Planos (tabelas legadas)
-- Confirmado como legado pelo diagrama arquitetural: sem conceito de "Plano"
-- no fluxo atual (Tomador → Avaliação → Lote → Pagamento → Laudo)
-- =============================================================================

-- Remover FK de entidades para planos ANTES de dropar planos
ALTER TABLE public.entidades
  DROP COLUMN IF EXISTS plano_id;

-- Remover FK de contratos para planos ANTES de dropar planos
ALTER TABLE public.contratos
  DROP COLUMN IF EXISTS plano_id;

-- Dropar tabelas na ordem correta (dependentes primeiro)
DROP TABLE IF EXISTS public.contratos_planos CASCADE;
DROP TABLE IF EXISTS public.contratacao_personalizada CASCADE;
DROP TABLE IF EXISTS public.planos CASCADE;

-- Dropar ENUM de tipo_plano se existir (criado junto com planos)
DROP TYPE IF EXISTS public.tipo_plano CASCADE;

-- =============================================================================
-- FASE 3: Remover coluna legada contratante_id de lotes_avaliacao
-- Migration 1016 adicionou entidade_id; trigger sincronizava ambas.
-- Coluna contratante_id não deve mais existir após unificação DEV/PROD.
-- =============================================================================

-- Trigger que sincronizava contratante_id ↔ entidade_id
DROP TRIGGER IF EXISTS trg_sync_entidade_contratante ON public.lotes_avaliacao;
DROP FUNCTION IF EXISTS public.sync_entidade_contratante_id() CASCADE;

-- Coluna legada (entidade_id é o campo correto)
ALTER TABLE public.lotes_avaliacao
  DROP COLUMN IF EXISTS contratante_id;

-- =============================================================================
-- FASE 4: Remover funções deprecated nunca chamadas pelo app
-- =============================================================================

-- Deprecated pela migration 1100, nunca chamada pelo app code
DROP FUNCTION IF EXISTS public.fn_create_laudo_imediatamente(integer) CASCADE;
DROP FUNCTION IF EXISTS public.fn_create_laudo_imediatamente() CASCADE;

-- Referenciava tabela relatorio_templates (pode não existir); nunca chamada
DROP FUNCTION IF EXISTS public.gerar_dados_relatorio(integer) CASCADE;
DROP FUNCTION IF EXISTS public.gerar_dados_relatorio() CASCADE;

-- Alias legado para current_setting RLS; substituído por app.current_tomador_id
DROP FUNCTION IF EXISTS public.current_user_contratante_id() CASCADE;

-- Função de relatório genérica não referenciada no app code
DROP FUNCTION IF EXISTS public.get_resultados_por_empresa(integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_resultados_por_empresa() CASCADE;

-- =============================================================================
-- FASE 5: Remover coluna hierarquia_comercial.comercial_id nunca usada
-- Adicionada em migration mas sem nenhuma referência no app code
-- =============================================================================

ALTER TABLE public.hierarquia_comercial
  DROP COLUMN IF EXISTS comercial_id;

-- =============================================================================
-- VERIFICAÇÃO FINAL: Confirmar que estruturas críticas foram removidas
-- (Queries abaixo retornam null/false se a remoção foi bem-sucedida)
-- =============================================================================

DO $$
DECLARE
  v_planos_exists boolean;
  v_contratos_planos_exists boolean;
  v_contratacao_personalizada_exists boolean;
  v_contratante_id_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'planos'
  ) INTO v_planos_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contratos_planos'
  ) INTO v_contratos_planos_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contratacao_personalizada'
  ) INTO v_contratacao_personalizada_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lotes_avaliacao'
      AND column_name = 'contratante_id'
  ) INTO v_contratante_id_exists;

  IF v_planos_exists OR v_contratos_planos_exists OR v_contratacao_personalizada_exists THEN
    RAISE EXCEPTION 'FALHA NA MIGRATION 1129: Tabelas legadas ainda existem (planos=%, contratos_planos=%, contratacao_personalizada=%)',
      v_planos_exists, v_contratos_planos_exists, v_contratacao_personalizada_exists;
  END IF;

  IF v_contratante_id_exists THEN
    RAISE EXCEPTION 'FALHA NA MIGRATION 1129: Coluna lotes_avaliacao.contratante_id ainda existe';
  END IF;

  RAISE NOTICE 'Migration 1129 concluída com sucesso: todas as estruturas legadas removidas';
END;
$$;

COMMIT;
