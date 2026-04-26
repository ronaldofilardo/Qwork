-- Migration 1139: Novo status 'pdf_gerado' no fluxo de assinatura ZapSign
-- Data: 2026-04-10
-- Descrição:
--   Introduz o status intermediário 'pdf_gerado' na máquina de estados de laudos.
--   Permite que o emissor gere o PDF localmente (1º clique) e depois acione
--   explicitamente a assinatura digital ZapSign (2º clique — "Assinar Digitalmente").
--
--   Nova máquina de estados ZapSign:
--     rascunho → pdf_gerado → aguardando_assinatura → enviado
--
--   Fluxo legado (DISABLE_ZAPSIGN=1): inalterado
--     rascunho → emitido
--
-- ATENÇÃO: ALTER TYPE ADD VALUE não pode correr dentro de transaction block
-- em versões PostgreSQL < 12. Neon usa PG 16+, então é seguro.

-- ─── 1. Adicionar 'pdf_gerado' ao ENUM de status de laudo ───────────────────
ALTER TYPE public.status_laudo_enum ADD VALUE IF NOT EXISTS 'pdf_gerado';

-- ─── 2. Atualizar CHECK constraint de laudos.status ──────────────────────────
ALTER TABLE public.laudos
  DROP CONSTRAINT IF EXISTS chk_laudos_status_valid;

ALTER TABLE public.laudos
  ADD CONSTRAINT chk_laudos_status_valid CHECK (
    (status)::text = ANY (ARRAY[
      'rascunho'::text,
      'pdf_gerado'::text,
      'emitido'::text,
      'enviado'::text,
      'aguardando_assinatura'::text
    ])
  );

-- ─── 3. Adicionar coluna de timestamp para o novo status ─────────────────────
ALTER TABLE public.laudos
  ADD COLUMN IF NOT EXISTS pdf_gerado_em TIMESTAMP WITHOUT TIME ZONE;

-- ─── 4. Comentário de documentação ──────────────────────────────────────────
COMMENT ON COLUMN public.laudos.pdf_gerado_em IS 'Timestamp em que o PDF foi gerado localmente (antes da assinatura ZapSign)';
