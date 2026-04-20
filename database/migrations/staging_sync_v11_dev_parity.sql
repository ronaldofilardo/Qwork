-- ============================================================================
-- STAGING SYNC V11: Paridade total com DEV
-- Data: 2026-04-20
-- Objetivo: Alinhar neondb_staging exatamente com nr-bps_db (DEV)
--
-- FASE 1 — ADICIONAR: colunas/enums que estão no DEV mas não no staging
--   - status_laudo_enum: aguardando_assinatura, pdf_gerado, assinado_processando
--   - laudos: zapsign_doc_token, zapsign_signer_token, zapsign_status,
--              assinado_em, pdf_gerado_em, zapsign_sign_url
--   - representantes: ativo
--   - vendedores_perfil: doc_nf_rpa_path → doc_nf_path (rename)
--   - funcionarios: crp, titulo_profissional
--
-- FASE 2 — REMOVER: colunas/tabelas que estão no staging mas não no DEV
--   - analise_estatistica: anomalia_detectada, tipo_anomalia (9003)
--   - comissoes_laudo: tipo_beneficiario, vendedor_id (1133)
--   - comissoes_laudo: ciclo_id, nf_path, nf_nome_arquivo, nf_rpa_* (manual)
--   - vinculos_comissao: percentual_comissao_vendedor (1133)
--   - leads_representante: percentual_comissao_vendedor (1133)
--   - ciclos_comissao: tipo_beneficiario, vendedor_id (1133)
--   - representantes: percentual_vendedor_direto (601)
--   - hierarquia_comercial: percentual_override (601)
--   - v_auditoria_emissoes: drop view (DEV não tem)
--   - ciclos_comissao: drop table inteira (DEV não tem)
-- ============================================================================

-- ============================================================================
-- FASE 1A: Enum status_laudo_enum — novos valores (sem transaction)
-- ALTER TYPE ADD VALUE não pode estar dentro de BEGIN/COMMIT em algumas configs
-- ============================================================================

ALTER TYPE public.status_laudo_enum ADD VALUE IF NOT EXISTS 'aguardando_assinatura';
ALTER TYPE public.status_laudo_enum ADD VALUE IF NOT EXISTS 'pdf_gerado';
ALTER TYPE public.status_laudo_enum ADD VALUE IF NOT EXISTS 'assinado_processando';

-- ============================================================================
-- FASE 1B: Colunas novas — tudo dentro de uma transaction
-- ============================================================================

BEGIN;

-- ─── laudos: colunas ZapSign (migration 1138) ─────────────────────────────
ALTER TABLE public.laudos
  ADD COLUMN IF NOT EXISTS zapsign_doc_token    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS zapsign_signer_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS zapsign_status       VARCHAR(50)  DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS assinado_em          TIMESTAMP WITHOUT TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_laudos_zapsign_doc_token
  ON public.laudos (zapsign_doc_token)
  WHERE zapsign_doc_token IS NOT NULL;

-- ─── laudos: pdf_gerado_em (migration 1139) ───────────────────────────────
ALTER TABLE public.laudos
  ADD COLUMN IF NOT EXISTS pdf_gerado_em TIMESTAMP WITHOUT TIME ZONE;

-- ─── laudos: zapsign_sign_url (migration 1143) ────────────────────────────
ALTER TABLE public.laudos
  ADD COLUMN IF NOT EXISTS zapsign_sign_url TEXT;

-- ─── laudos: atualizar CHECK constraint para estado final (migration 1143) ─
ALTER TABLE public.laudos
  DROP CONSTRAINT IF EXISTS chk_laudos_status_valid;

ALTER TABLE public.laudos
  ADD CONSTRAINT chk_laudos_status_valid CHECK (
    status IN (
      'rascunho',
      'pdf_gerado',
      'aguardando_assinatura',
      'assinado_processando',
      'emitido',
      'enviado'
    )
  );

-- ─── representantes: coluna ativo (migration 1108) ────────────────────────
ALTER TABLE public.representantes
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_representantes_ativo
  ON public.representantes (ativo);

CREATE INDEX IF NOT EXISTS idx_representantes_status_ativo
  ON public.representantes (status, ativo);

-- ─── vendedores_perfil: rename doc_nf_rpa_path → doc_nf_path (migration 1217)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendedores_perfil' AND column_name = 'doc_nf_rpa_path'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendedores_perfil' AND column_name = 'doc_nf_path'
  ) THEN
    ALTER TABLE public.vendedores_perfil
      RENAME COLUMN doc_nf_rpa_path TO doc_nf_path;
    RAISE NOTICE 'Renamed doc_nf_rpa_path → doc_nf_path in vendedores_perfil';
  ELSE
    RAISE NOTICE 'Column doc_nf_path já existe ou doc_nf_rpa_path não existe — pulando rename';
  END IF;
END $$;

-- ─── funcionarios: crp e titulo_profissional (paridade com DEV) ────────────
ALTER TABLE public.funcionarios
  ADD COLUMN IF NOT EXISTS crp               VARCHAR(20)  NULL,
  ADD COLUMN IF NOT EXISTS titulo_profissional VARCHAR(100) NULL;

-- ============================================================================
-- FASE 2A: Remover colunas de anomalia (migration 9003)
-- ============================================================================

-- Remover funções de detecção de anomalias
DROP FUNCTION IF EXISTS detectar_anomalias_indice(integer) CASCADE;
DROP FUNCTION IF EXISTS detectar_anomalias_indice(bigint) CASCADE;
DROP FUNCTION IF EXISTS detectar_anomalia_score(numeric, text, integer) CASCADE;
DROP FUNCTION IF EXISTS detectar_anomalia_score(numeric, varchar, integer) CASCADE;

ALTER TABLE public.analise_estatistica DROP COLUMN IF EXISTS anomalia_detectada;
ALTER TABLE public.analise_estatistica DROP COLUMN IF EXISTS tipo_anomalia;

-- ============================================================================
-- FASE 2B: Remover colunas de comissão de vendedor (migr. 1133 + 601)
-- ============================================================================

-- Drop RLS policies de vendedor
DROP POLICY IF EXISTS vendedor_comissoes_laudo_own ON public.comissoes_laudo;
DROP POLICY IF EXISTS vendedor_vinculos_comissao_own ON public.vinculos_comissao;

-- comissoes_laudo: remover vendedor_id e tipo_beneficiario (1133)
DROP INDEX IF EXISTS idx_comissoes_laudo_lote_parcela_beneficiario;

ALTER TABLE public.comissoes_laudo
  DROP COLUMN IF EXISTS vendedor_id;

ALTER TABLE public.comissoes_laudo
  DROP COLUMN IF EXISTS tipo_beneficiario;

-- comissoes_laudo: criar índice único sem tipo_beneficiario
CREATE UNIQUE INDEX IF NOT EXISTS idx_comissoes_laudo_lote_parcela
  ON public.comissoes_laudo (lote_pagamento_id, parcela_numero)
  WHERE lote_pagamento_id IS NOT NULL;

-- comissoes_laudo: remover colunas NF/RPA legadas (não estão no DEV)
ALTER TABLE public.comissoes_laudo DROP COLUMN IF EXISTS ciclo_id;
ALTER TABLE public.comissoes_laudo DROP COLUMN IF EXISTS nf_path;
ALTER TABLE public.comissoes_laudo DROP COLUMN IF EXISTS nf_nome_arquivo;
ALTER TABLE public.comissoes_laudo DROP COLUMN IF EXISTS nf_rpa_enviada_em;
ALTER TABLE public.comissoes_laudo DROP COLUMN IF EXISTS nf_rpa_aprovada_em;
ALTER TABLE public.comissoes_laudo DROP COLUMN IF EXISTS nf_rpa_rejeitada_em;
ALTER TABLE public.comissoes_laudo DROP COLUMN IF EXISTS nf_rpa_motivo_rejeicao;

-- vinculos_comissao: remover percentual_comissao_vendedor (1133/601)
ALTER TABLE public.vinculos_comissao
  DROP CONSTRAINT IF EXISTS chk_vinculos_comissao_total_max;
ALTER TABLE public.vinculos_comissao
  DROP CONSTRAINT IF EXISTS chk_vinculos_perc_vend_range;
ALTER TABLE public.vinculos_comissao
  DROP COLUMN IF EXISTS percentual_comissao_vendedor;

-- leads_representante: remover percentual_comissao_vendedor (1133/601)
ALTER TABLE public.leads_representante
  DROP CONSTRAINT IF EXISTS chk_leads_comissao_total_max;
ALTER TABLE public.leads_representante
  DROP CONSTRAINT IF EXISTS chk_leads_perc_vend_range;
ALTER TABLE public.leads_representante
  DROP COLUMN IF EXISTS percentual_comissao_vendedor;

-- ciclos_comissao: remover tipo_beneficiario e vendedor_id (1133)
ALTER TABLE public.ciclos_comissao DROP COLUMN IF EXISTS tipo_beneficiario;
ALTER TABLE public.ciclos_comissao DROP COLUMN IF EXISTS vendedor_id;

-- representantes: remover percentual_vendedor_direto (601)
ALTER TABLE public.representantes DROP COLUMN IF EXISTS percentual_vendedor_direto;

-- hierarquia_comercial: remover percentual_override (601)
ALTER TABLE public.hierarquia_comercial DROP COLUMN IF EXISTS percentual_override;

-- ============================================================================
-- FASE 2C: Dropar tabela ciclos_comissao e view v_auditoria_emissoes
-- DEV não tem estes objetos
-- ============================================================================

-- Dropar view v_auditoria_emissoes (criada pela migration 1134 só para staging)
DROP VIEW IF EXISTS public.v_auditoria_emissoes CASCADE;

-- Dropar tabela ciclos_comissao (ciclo_id FK já foi removida acima)
DROP TABLE IF EXISTS public.ciclos_comissao CASCADE;

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON COLUMN public.representantes.ativo
  IS 'Controla acesso ao sistema. false = login bloqueado. Independente do status de negócio.';
COMMENT ON COLUMN public.laudos.zapsign_doc_token
  IS 'Token do documento no ZapSign (lookup no webhook)';
COMMENT ON COLUMN public.laudos.zapsign_signer_token
  IS 'Token do assinante no ZapSign (para link direto de assinatura)';
COMMENT ON COLUMN public.laudos.zapsign_status
  IS 'Status retornado pelo ZapSign: pending | signed | refused | expired';
COMMENT ON COLUMN public.laudos.assinado_em
  IS 'Timestamp da assinatura digital (preenchido pelo webhook ZapSign)';
COMMENT ON COLUMN public.laudos.pdf_gerado_em
  IS 'Timestamp em que o PDF foi gerado localmente (antes da assinatura ZapSign)';
COMMENT ON COLUMN public.laudos.zapsign_sign_url
  IS 'URL direta de assinatura retornada pelo ZapSign.';
COMMENT ON COLUMN public.funcionarios.crp
  IS 'CRP do psicólogo emissor (se aplicável)';
COMMENT ON COLUMN public.funcionarios.titulo_profissional
  IS 'Título profissional (ex: Psicólogo)';

COMMIT;
