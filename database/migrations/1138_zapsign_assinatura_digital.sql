-- Migration 1138: Integração ZapSign — Assinatura Digital de Laudos
-- Data: 2026-04-10
-- Descrição:
--   Adiciona colunas necessárias para rastrear o processo de assinatura digital
--   via ZapSign (sandbox/produção). O fluxo passa a ser:
--     rascunho → aguardando_assinatura → enviado
--   O hash_pdf é calculado SOMENTE do PDF já assinado (imutabilidade forçada).

-- ─── 1. Adicionar 'aguardando_assinatura' ao ENUM de status de laudo ───────
-- ATENÇÃO: ALTER TYPE ADD VALUE não pode correr dentro de transaction block
-- em versões PostgreSQL < 12. Neon usa PG 16+, então é seguro.
ALTER TYPE public.status_laudo_enum ADD VALUE IF NOT EXISTS 'aguardando_assinatura';

-- ─── 2. Atualizar CHECK constraint de laudos.status ─────────────────────────
ALTER TABLE public.laudos
  DROP CONSTRAINT IF EXISTS chk_laudos_status_valid;

ALTER TABLE public.laudos
  ADD CONSTRAINT chk_laudos_status_valid CHECK (
    (status)::text = ANY (ARRAY[
      'rascunho'::text,
      'emitido'::text,
      'enviado'::text,
      'aguardando_assinatura'::text
    ])
  );

-- ─── 3. Adicionar colunas ZapSign ────────────────────────────────────────────
ALTER TABLE public.laudos
  ADD COLUMN IF NOT EXISTS zapsign_doc_token   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS zapsign_signer_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS zapsign_status       VARCHAR(50)  DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS assinado_em          TIMESTAMP WITHOUT TIME ZONE;

-- ─── 4. Índice para lookup rápido no webhook (token → laudo) ─────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_laudos_zapsign_doc_token
  ON public.laudos (zapsign_doc_token)
  WHERE zapsign_doc_token IS NOT NULL;

-- ─── 5. Comentários de documentação ─────────────────────────────────────────
COMMENT ON COLUMN public.laudos.zapsign_doc_token    IS 'Token do documento no ZapSign (lookup no webhook)';
COMMENT ON COLUMN public.laudos.zapsign_signer_token IS 'Token do assinante no ZapSign (para link direto de assinatura)';
COMMENT ON COLUMN public.laudos.zapsign_status       IS 'Status retornado pelo ZapSign: pending | signed | refused | expired';
COMMENT ON COLUMN public.laudos.assinado_em          IS 'Timestamp da assinatura digital (preenchido pelo webhook ZapSign)';
