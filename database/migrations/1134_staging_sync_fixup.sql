-- =============================================================================
-- Migration 1134: Fix-up de Sincronização Staging ↔ DEV (Root Causes)
-- Data: 2026-03-31
-- Objetivo: Corrigir TODAS as divergências de schema entre staging e DEV
--   identificadas após execução do v3 script.
--
-- PROBLEMAS ENCONTRADOS:
--   1. clinicas.entidade_id não existe em staging → cascade de falhas em
--      QUALQUER migration que crie view com JOIN clinicas (via c.entidade_id)
--   2. importacoes_clinica criada com schema diferente (total_* prefix vs DEV)
--   3. lotes_avaliacao.contratante_id tem dependências que bloqueiam migration 1129
--   4. Colunas ausentes: representantes.percentual_comissao,
--      leads_representante.percentual_comissao,
--      comissoes_laudo.parcela_confirmada_em,
--      vinculos_comissao.clinica_id + percentual_comissao_*
--
-- ESTRATÉGIA:
--   1. Adicionar clinicas.entidade_id (root cause)
--   2. Remover dependências de lotes_avaliacao.contratante_id (CASCADE)
--   3. Corrigir importacoes_clinica column names
--   4. Adicionar colunas ausentes diretamente (sem depender de views)
-- =============================================================================

-- =============================================================================
-- PARTE 1: Adicionar clinicas.entidade_id (ROOT CAUSE FIX)
-- =============================================================================

ALTER TABLE public.clinicas
  ADD COLUMN IF NOT EXISTS entidade_id INTEGER REFERENCES public.entidades(id);

ALTER TABLE public.clinicas
  ADD COLUMN IF NOT EXISTS numero_funcionarios_estimado INTEGER;

-- =============================================================================
-- PARTE 2: Remover dependências de lotes_avaliacao.contratante_id
-- Migration 1129 falha porque policy e view dependem dessa coluna.
-- Usando CASCADE para remoção automática de dependentes.
-- A view v_auditoria_emissoes será recriada logo abaixo.
-- =============================================================================

-- Dropar policy avaliacao_resets_select_policy (depende de contratante_id)
DROP POLICY IF EXISTS avaliacao_resets_select_policy ON public.avaliacao_resets;

-- Dropar view v_auditoria_emissoes (depende de contratante_id em lotes)
DROP VIEW IF EXISTS public.v_auditoria_emissoes CASCADE;

-- Agora pode dropar a coluna
ALTER TABLE public.lotes_avaliacao
  DROP COLUMN IF EXISTS contratante_id;

-- Recriar v_auditoria_emissoes sem contratante_id (usando entidade_id)
-- Baseado no estado DEV atual + migration 164_remove_codigo_titulo
CREATE OR REPLACE VIEW public.v_auditoria_emissoes AS
SELECT
  la.id AS lote_id,
  la.entidade_id,
  la.clinica_id,
  la.status AS lote_status,
  la.tipo,
  la.criado_em,
  la.emitido_em,
  la.enviado_em,
  la.liberado_em,
  la.liberado_por,
  la.solicitacao_emissao_em,
  -- Laudo
  l.id AS laudo_id,
  l.status AS laudo_status,
  l.emissor_cpf,
  l.emitido_em AS laudo_emitido_em,
  l.enviado_em AS laudo_enviado_em,
  -- Solicitante (tomador)
  COALESCE(e.nome, c.nome) AS tomador_nome,
  u.cpf AS solicitante_cpf,
  u.nome AS solicitante_nome
FROM public.lotes_avaliacao la
LEFT JOIN public.laudos l ON l.lote_id = la.id
LEFT JOIN public.entidades e ON e.id = la.entidade_id
LEFT JOIN public.clinicas c ON c.id = la.clinica_id
LEFT JOIN public.usuarios u ON u.cpf = la.liberado_por;

COMMENT ON VIEW public.v_auditoria_emissoes IS 'View de auditoria de emissões de laudos (sem contratante_id legado)';

-- =============================================================================
-- PARTE 3: Corrigir estrutura de importacoes_clinica
-- Staging foi criada por migration 1000 (total_* prefix)
-- DEV usa nomes sem total_* prefix + adiciona tempo_processamento_ms
-- Código da API usa: empresas_criadas, funcionarios_criados, vinculos_criados, etc
-- =============================================================================

DO $$
BEGIN
  -- Renomear colunas com total_* prefix para nomes sem prefixo
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'importacoes_clinica' AND column_name = 'total_empresas_criadas'
  ) THEN
    ALTER TABLE public.importacoes_clinica RENAME COLUMN total_empresas_criadas TO empresas_criadas;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'importacoes_clinica' AND column_name = 'total_empresas_existentes'
  ) THEN
    ALTER TABLE public.importacoes_clinica RENAME COLUMN total_empresas_existentes TO empresas_existentes;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'importacoes_clinica' AND column_name = 'total_funcionarios_criados'
  ) THEN
    ALTER TABLE public.importacoes_clinica RENAME COLUMN total_funcionarios_criados TO funcionarios_criados;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'importacoes_clinica' AND column_name = 'total_funcionarios_atualizados'
  ) THEN
    ALTER TABLE public.importacoes_clinica RENAME COLUMN total_funcionarios_atualizados TO funcionarios_atualizados;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'importacoes_clinica' AND column_name = 'total_vinculos_criados'
  ) THEN
    ALTER TABLE public.importacoes_clinica RENAME COLUMN total_vinculos_criados TO vinculos_criados;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'importacoes_clinica' AND column_name = 'total_vinculos_atualizados'
  ) THEN
    ALTER TABLE public.importacoes_clinica RENAME COLUMN total_vinculos_atualizados TO vinculos_atualizados;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'importacoes_clinica' AND column_name = 'total_inativacoes'
  ) THEN
    ALTER TABLE public.importacoes_clinica RENAME COLUMN total_inativacoes TO inativacoes;
  END IF;
END $$;

-- Adicionar colunas que DEV tem mas staging não
ALTER TABLE public.importacoes_clinica
  ADD COLUMN IF NOT EXISTS tempo_processamento_ms INTEGER;

-- =============================================================================
-- PARTE 4: Adicionar colunas ausentes (que precisam existir antes das views)
-- =============================================================================

-- 4.1 representantes.percentual_comissao (adicionado por 503 que falhava por views)
ALTER TABLE public.representantes
  ADD COLUMN IF NOT EXISTS percentual_comissao NUMERIC(5,2) DEFAULT NULL;

-- 4.2 leads_representante.percentual_comissao (legacy, ref. por migration 1120)
ALTER TABLE public.leads_representante
  ADD COLUMN IF NOT EXISTS percentual_comissao NUMERIC(5,2) DEFAULT NULL;

-- 4.3 comissoes_laudo.parcela_confirmada_em (adicionado por 532 que falhava por views)
ALTER TABLE public.comissoes_laudo
  ADD COLUMN IF NOT EXISTS parcela_confirmada_em TIMESTAMPTZ NULL;

-- 4.4 Remover colunas obsoletas de comissoes_laudo (que 503 devia ter removido)
ALTER TABLE public.comissoes_laudo
  DROP COLUMN IF EXISTS percentual_custas_plataforma;

ALTER TABLE public.comissoes_laudo
  DROP COLUMN IF EXISTS valor_comissionavel;

-- 4.5 vinculos_comissao.clinica_id + percentual_comissao_*
--     (adicionados por 504/1121 que falhavam por views)
ALTER TABLE public.vinculos_comissao
  ADD COLUMN IF NOT EXISTS clinica_id INTEGER;

ALTER TABLE public.vinculos_comissao
  ADD COLUMN IF NOT EXISTS percentual_comissao_representante NUMERIC(5,2);

ALTER TABLE public.vinculos_comissao
  ADD COLUMN IF NOT EXISTS percentual_comissao_vendedor NUMERIC(5,2) NOT NULL DEFAULT 0;

-- 4.6 leads_representante split columns (adicionados por 1120 que falhava)
ALTER TABLE public.leads_representante
  ADD COLUMN IF NOT EXISTS percentual_comissao_representante NUMERIC(5,2);

ALTER TABLE public.leads_representante
  ADD COLUMN IF NOT EXISTS percentual_comissao_vendedor NUMERIC(5,2) NOT NULL DEFAULT 0;

-- =============================================================================
-- PARTE 5: Verificação final
-- =============================================================================

DO $$
DECLARE
  v_ok BOOLEAN := TRUE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clinicas' AND column_name='entidade_id') THEN
    RAISE NOTICE 'FALHA: clinicas.entidade_id ausente';
    v_ok := FALSE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lotes_avaliacao' AND column_name='contratante_id') THEN
    RAISE NOTICE 'FALHA: lotes_avaliacao.contratante_id ainda existe';
    v_ok := FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='representantes' AND column_name='percentual_comissao') THEN
    RAISE NOTICE 'FALHA: representantes.percentual_comissao ausente';
    v_ok := FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vinculos_comissao' AND column_name='clinica_id') THEN
    RAISE NOTICE 'FALHA: vinculos_comissao.clinica_id ausente';
    v_ok := FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads_representante' AND column_name='percentual_comissao_representante') THEN
    RAISE NOTICE 'FALHA: leads_representante.percentual_comissao_representante ausente';
    v_ok := FALSE;
  END IF;

  IF v_ok THEN
    RAISE NOTICE 'SUCCESS: Todas as verificações passaram';
  END IF;
END $$;
