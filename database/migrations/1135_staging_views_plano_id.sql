-- =============================================================================
-- Migration 1135: Views tomadores/gestores + coluna plano_id
-- Data: 2026-04-01
-- Objetivo: Completar sincronizacao staging com DEV, apos migracoes 1134.
--
-- PROBLEMAS ENCONTRADOS APOS 1134:
--   1. entidades.plano_id nao existe em staging (existe em DEV)
--   2. clinicas.plano_id nao existe em staging (existe em DEV)
--   3. Views tomadores e gestores ausentes em staging
--
-- SOLUCAO:
--   1. Adicionar plano_id a entidades e clinicas
--   2. Criar views tomadores e gestores (espelham DEV)
-- =============================================================================

-- =============================================================================
-- PARTE 1: Adicionar plano_id a entidades e clinicas
-- =============================================================================

-- Staging nao tem tabela planos, por isso sem FK constraint
ALTER TABLE public.entidades
  ADD COLUMN IF NOT EXISTS plano_id INTEGER;

ALTER TABLE public.clinicas
  ADD COLUMN IF NOT EXISTS plano_id INTEGER;

-- =============================================================================
-- PARTE 2: View tomadores (UNION de entidades + clinicas)
-- Critica: usada em api/tomador/contrato-pdf, api/entidade/relatorio-*
-- =============================================================================

CREATE OR REPLACE VIEW public.tomadores AS
  SELECT id, nome, cnpj,
         'entidade'::varchar(20) AS tipo,
         email, responsavel_nome, responsavel_cpf,
         responsavel_email, responsavel_celular,
         plano_id, ativa, pagamento_confirmado, status,
         numero_funcionarios_estimado, criado_em, atualizado_em
  FROM public.entidades WHERE id IS NOT NULL
  UNION ALL
  SELECT id, nome, cnpj,
         'clinica'::varchar(20) AS tipo,
         email, responsavel_nome, responsavel_cpf,
         responsavel_email, responsavel_celular,
         plano_id, ativa, pagamento_confirmado, status,
         numero_funcionarios_estimado, criado_em, atualizado_em
  FROM public.clinicas WHERE id IS NOT NULL;

-- =============================================================================
-- PARTE 3: View gestores (usuarios tipo rh e gestor)
-- =============================================================================

CREATE OR REPLACE VIEW public.gestores AS
  SELECT cpf, nome, email,
    tipo_usuario AS usuario_tipo,
    CASE
      WHEN tipo_usuario = 'rh'::usuario_tipo_enum THEN 'RH (Clinica)'
      WHEN tipo_usuario = 'gestor'::usuario_tipo_enum THEN 'Gestor de Entidade'
      ELSE 'Outro'
    END AS tipo_gestor_descricao,
    clinica_id, entidade_id, ativo, criado_em, atualizado_em
  FROM public.usuarios
  WHERE tipo_usuario = ANY(ARRAY['rh'::usuario_tipo_enum, 'gestor'::usuario_tipo_enum]);

-- =============================================================================
-- Verificacao final
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entidades' AND column_name = 'plano_id'
  ) THEN
    RAISE EXCEPTION 'FAIL: entidades.plano_id nao criado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_views WHERE viewname = 'tomadores'
  ) THEN
    RAISE EXCEPTION 'FAIL: view tomadores nao criada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_views WHERE viewname = 'gestores'
  ) THEN
    RAISE EXCEPTION 'FAIL: view gestores nao criada';
  END IF;

  RAISE NOTICE 'SUCCESS: Migration 1135 aplicada com sucesso';
END $$;
