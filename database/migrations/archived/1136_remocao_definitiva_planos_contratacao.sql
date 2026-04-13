-- =============================================================================
-- Migration 1136: Remoção Definitiva — Sistema Planos + Contratação Personalizada
-- Data: 2026-04-01
-- Objetivo: Consolidar e garantir a remoção completa de todas as estruturas do
--           sistema legado de "Planos" que as migrations 533 e 1129 planejaram
--           mas cujos vestígios ainda podem existir nos bancos DEV, TEST e staging.
--
-- CONTEXTO:
--   - O sistema atual usa pagamento por lote — NÃO usa planos/contratos_planos
--   - Migrations 533 e 1129 declararam a remoção mas não há garantia de execução
--   - migration 163/164 removeram modo_emergencia (fora do escopo)
--   - Código de produção referenciava essas tabelas — código foi limpo junto
--
-- SEGURANÇA: Todos os comandos usam IF EXISTS / CASCADE → 100% idempotente
-- BANCOS ALVO: nr-bps_db (DEV), nr-bps_db_test (TEST), neondb_staging (staging)
-- =============================================================================

BEGIN;

-- =============================================================================
-- FASE A: Remover triggers e funções dependentes ANTES das tabelas
-- =============================================================================

-- Trigger de sincronia que referenciava contratantes (renomeados para entidades)
DROP TRIGGER IF EXISTS sync_personalizado_status_trg ON public.contratacao_personalizada;
DROP FUNCTION IF EXISTS public.sync_personalizado_status() CASCADE;

-- Função de validação de token de pagamento do sistema de planos
DROP FUNCTION IF EXISTS public.fn_validar_token_pagamento(character varying) CASCADE;
DROP FUNCTION IF EXISTS public.fn_validar_token_pagamento(varchar) CASCADE;

-- Trigger de sincronia tipo_plano (criado pela migration 1017)
DROP TRIGGER IF EXISTS trg_sync_tomador_plano_tipo ON public.tomadores;
DROP FUNCTION IF EXISTS public.sync_tomador_plano_tipo() CASCADE;

-- Triggers de auditoria das tabelas de planos
DROP TRIGGER IF EXISTS trigger_audit_contratos_planos_insert ON public.contratos_planos CASCADE;
DROP TRIGGER IF EXISTS trigger_audit_contratos_planos_update ON public.contratos_planos CASCADE;
DROP TRIGGER IF EXISTS trigger_audit_contratos_planos_delete ON public.contratos_planos CASCADE;
DROP TRIGGER IF EXISTS trigger_audit_auditoria_planos_insert ON public.auditoria_planos CASCADE;
DROP TRIGGER IF EXISTS trigger_audit_auditoria_planos_update ON public.auditoria_planos CASCADE;
DROP TRIGGER IF EXISTS trigger_audit_auditoria_planos_delete ON public.auditoria_planos CASCADE;

-- =============================================================================
-- FASE B: Remover constraints/FK de tabelas que SOBREVIVEM (entidades, clinicas, contratos)
-- Precisa vir antes de dropar as tabelas referenciadas
-- =============================================================================

-- FK de entidades para planos
ALTER TABLE IF EXISTS public.entidades
  DROP CONSTRAINT IF EXISTS entidades_plano_id_fkey CASCADE;

-- FK de clinicas para planos
ALTER TABLE IF EXISTS public.clinicas
  DROP CONSTRAINT IF EXISTS clinicas_plano_id_fkey CASCADE;

-- FK de tomadores para planos (condicional: tomadores pode ser VIEW em alguns ambientes)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tomadores' AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE public.tomadores DROP CONSTRAINT IF EXISTS tomadores_plano_id_fkey CASCADE;
  END IF;
END $$;

-- FK de contratos para planos
ALTER TABLE IF EXISTS public.contratos
  DROP CONSTRAINT IF EXISTS contratos_plano_id_fkey CASCADE;

-- FK de contratos_planos (internas — serão resolvidas pelo CASCADE ao dropar a tabela)
ALTER TABLE IF EXISTS public.contratos_planos
  DROP CONSTRAINT IF EXISTS contratos_planos_plano_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.contratos_planos
  DROP CONSTRAINT IF EXISTS contratos_planos_clinica_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.contratos_planos
  DROP CONSTRAINT IF EXISTS contratos_planos_contratante_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.contratos_planos
  DROP CONSTRAINT IF EXISTS contratos_planos_tomador_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.contratos_planos
  DROP CONSTRAINT IF EXISTS contratos_planos_entidade_id_fkey CASCADE;

-- FK de auditoria_planos
ALTER TABLE IF EXISTS public.auditoria_planos
  DROP CONSTRAINT IF EXISTS auditoria_planos_plano_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.auditoria_planos
  DROP CONSTRAINT IF EXISTS auditoria_planos_contrato_id_fkey CASCADE;

-- FK de historico_contratos_planos
ALTER TABLE IF EXISTS public.historico_contratos_planos
  DROP CONSTRAINT IF EXISTS historico_contratos_planos_contrato_id_fkey CASCADE;

-- FK de payment_links
ALTER TABLE IF EXISTS public.payment_links
  DROP CONSTRAINT IF EXISTS fk_token_plano CASCADE;

-- FK de notificacoes_financeiras
ALTER TABLE IF EXISTS public.notificacoes_financeiras
  DROP CONSTRAINT IF EXISTS notificacoes_financeiras_contrato_id_fkey CASCADE;

-- =============================================================================
-- FASE C: DROP TABLES na ordem correta (dependentes primeiro)
-- =============================================================================

-- Histórico de contratos (depende de contratos_planos)
DROP TABLE IF EXISTS public.historico_contratos_planos CASCADE;

-- Auditoria de planos (depende de contratos_planos e planos)
DROP TABLE IF EXISTS public.auditoria_planos CASCADE;

-- Tabela de contratação personalizada (legacy — fluxo descontinuado)
DROP TABLE IF EXISTS public.contratacao_personalizada CASCADE;

-- Tabela de contratos de planos (depende de planos)
DROP TABLE IF EXISTS public.contratos_planos CASCADE;

-- Tabela de links de pagamento (depende de planos)
DROP TABLE IF EXISTS public.payment_links CASCADE;

-- Tabela principal de planos (leaf)
DROP TABLE IF EXISTS public.planos CASCADE;

-- =============================================================================
-- FASE D: DROP SEQUENCES
-- =============================================================================

DROP SEQUENCE IF EXISTS public.planos_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.contratos_planos_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.historico_contratos_planos_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.auditoria_planos_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.payment_links_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.contratacao_personalizada_id_seq CASCADE;

-- =============================================================================
-- FASE E: DROP COLUMNS de tabelas que permanecem no sistema
-- =============================================================================

-- Se 'tomadores' é uma VIEW (alguns ambientes), precisa ser dropada antes de
-- remover as colunas de entidades/clinicas que ela referencia, e depois recriada.
-- CASCADE derruba também as views dependentes (ex: v_relatorio_emissoes).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'tomadores'
  ) THEN
    DROP VIEW public.tomadores CASCADE;
  END IF;
END $$;

-- Remover plano_id de entidades
ALTER TABLE IF EXISTS public.entidades
  DROP COLUMN IF EXISTS plano_id;

-- Remover plano_id de clinicas
ALTER TABLE IF EXISTS public.clinicas
  DROP COLUMN IF EXISTS plano_id;

-- Remover plano_id e colunas relacionadas de contratos
ALTER TABLE IF EXISTS public.contratos
  DROP COLUMN IF EXISTS plano_id CASCADE,
  DROP COLUMN IF EXISTS valor_personalizado CASCADE,
  DROP COLUMN IF EXISTS payment_link_token CASCADE,
  DROP COLUMN IF EXISTS payment_link_expiracao CASCADE,
  DROP COLUMN IF EXISTS link_enviado_em CASCADE;

-- Remover colunas de plano de tomadores (condicional: tomadores pode ser VIEW em alguns ambientes)
-- Nota: se tomadores é uma VIEW sobre entidades, a coluna plano_id some automaticamente
-- quando entidades.plano_id é removida acima
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tomadores' AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE public.tomadores DROP COLUMN IF EXISTS plano_id CASCADE;
    ALTER TABLE public.tomadores DROP COLUMN IF EXISTS plano_tipo CASCADE;
  END IF;
END $$;

-- Recriar VIEW tomadores sem plano_id (se ela foi derrubada acima)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'tomadores'
  ) THEN
    -- Recriar a VIEW unificada de tomadores sem plano_id
    EXECUTE $view$
      CREATE VIEW public.tomadores AS
        SELECT
          entidades.id,
          entidades.nome,
          entidades.cnpj,
          'entidade'::character varying(20) AS tipo,
          entidades.email,
          entidades.responsavel_nome,
          entidades.responsavel_cpf,
          entidades.responsavel_email,
          entidades.responsavel_celular,
          entidades.ativa,
          entidades.pagamento_confirmado,
          entidades.status,
          entidades.numero_funcionarios_estimado,
          entidades.criado_em,
          entidades.atualizado_em
        FROM entidades
        WHERE entidades.id IS NOT NULL
        UNION ALL
        SELECT
          clinicas.id,
          clinicas.nome,
          clinicas.cnpj,
          'clinica'::character varying(20) AS tipo,
          clinicas.email,
          clinicas.responsavel_nome,
          clinicas.responsavel_cpf,
          clinicas.responsavel_email,
          clinicas.responsavel_celular,
          clinicas.ativa,
          clinicas.pagamento_confirmado,
          clinicas.status,
          clinicas.numero_funcionarios_estimado,
          clinicas.criado_em,
          clinicas.atualizado_em
        FROM clinicas
        WHERE clinicas.id IS NOT NULL
    $view$;
    RAISE NOTICE 'Migration 1136: VIEW tomadores recriada sem plano_id.';

    -- Recriar v_relatorio_emissoes (dependia de tomadores, foi derrubada em cascata)
    EXECUTE $vr$
      CREATE VIEW public.v_relatorio_emissoes AS
        SELECT
          l.id AS lote_id,
          l.tipo AS lote_tipo,
          l.status AS lote_status,
          l.liberado_em,
          CASE
            WHEN l.clinica_id IS NOT NULL THEN 'clinica'::text
            WHEN l.entidade_id IS NOT NULL THEN 'entidade'::text
            ELSE NULL::text
          END AS fonte_tipo,
          COALESCE(c.nome, t.nome) AS fonte_nome,
          COALESCE(l.clinica_id, l.entidade_id) AS fonte_id,
          ec.nome AS empresa_nome,
          l.empresa_id,
          ld.id AS laudo_id,
          ld.status AS laudo_status,
          ld.emitido_em AS laudo_emitido_em,
          ld.enviado_em AS laudo_enviado_em,
          ld.emissor_cpf,
          COUNT(DISTINCT a.id) AS total_avaliacoes,
          COUNT(DISTINCT a.id) FILTER (WHERE a.status::text = 'concluida'::text) AS avaliacoes_concluidas
        FROM lotes_avaliacao l
          LEFT JOIN clinicas c ON c.id = l.clinica_id
          LEFT JOIN tomadores t ON t.id = l.entidade_id
          LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
          LEFT JOIN laudos ld ON ld.lote_id = l.id
          LEFT JOIN avaliacoes a ON a.lote_id = l.id
        GROUP BY l.id, l.tipo, l.status, l.liberado_em, l.clinica_id, l.entidade_id, l.empresa_id,
                 c.nome, t.nome, ec.nome, ld.id, ld.status, ld.emitido_em, ld.enviado_em, ld.emissor_cpf
    $vr$;
    RAISE NOTICE 'Migration 1136: VIEW v_relatorio_emissoes recriada.';
  END IF;
END $$;

-- Remover remnantes de colunas de plano em clinicas
ALTER TABLE IF EXISTS public.clinicas
  DROP COLUMN IF EXISTS plano_personalizado_pendente CASCADE;

-- =============================================================================
-- FASE F: DROP ENUM TYPE
-- =============================================================================

DROP TYPE IF EXISTS public.tipo_plano CASCADE;

-- =============================================================================
-- FASE G: Limpar views obsoletas que referenciavam planos
-- =============================================================================

DROP VIEW IF EXISTS public.v_auditoria_emissoes CASCADE;
DROP VIEW IF EXISTS public.vw_solicitacoes_emissao_entidade CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mat_vw_recibos CASCADE;

-- =============================================================================
-- FASE H: Verificação diagnóstica (sem erro — apenas log)
-- =============================================================================

DO $$
DECLARE
  table_count INT;
  col_count   INT;
BEGIN
  -- Verificar tabelas restantes com nome de plano
  SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
   WHERE table_schema = 'public'
     AND (
       table_name LIKE '%plano%'
       OR table_name = 'contratacao_personalizada'
       OR table_name = 'payment_links'
     );

  IF table_count > 0 THEN
    RAISE WARNING 'Migration 1136: % tabela(s) relacionadas a planos ainda encontradas.', table_count;
  ELSE
    RAISE NOTICE 'Migration 1136: OK — nenhuma tabela de planos encontrada.';
  END IF;

  -- Verificar coluna plano_id em tabelas principais
  SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND column_name = 'plano_id'
     AND table_name IN ('entidades', 'clinicas', 'contratos', 'tomadores');

  IF col_count > 0 THEN
    RAISE WARNING 'Migration 1136: % coluna(s) plano_id ainda presentes nas tabelas principais.', col_count;
  ELSE
    RAISE NOTICE 'Migration 1136: OK — sem colunas plano_id nas tabelas principais.';
  END IF;
END $$;

COMMIT;
