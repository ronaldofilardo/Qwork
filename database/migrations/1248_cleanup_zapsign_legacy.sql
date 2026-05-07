-- Migration 1248: Remoção completa de colunas e constraints ZapSign legadas
-- Data: 2026-05-07
-- Contexto:
--   A integração ZapSign foi removida do código (commit ab93f6c).
--   Esta migration limpa os artefatos de banco introduzidos pelas migrations
--   1138, 1143a, 1144_fix_zapsign e 1241:
--     - Colunas: zapsign_doc_token, zapsign_signer_token, zapsign_status,
--                zapsign_sign_url, assinado_em
--     - Índice:  idx_laudos_zapsign_doc_token
--     - CHECK constraint: remove 'aguardando_assinatura' e 'assinado_processando'
--       dos valores válidos de laudos.status
--
--   Mantidos (fluxo manual de emissão ainda utiliza):
--     - status 'pdf_gerado' e coluna 'pdf_gerado_em' (adicionados em 1139b)
--     - tipo de coluna VARCHAR(25) para laudos.status (1241)
--
-- ATENÇÃO: DROP COLUMN é irreversível. Verificar se há dados em zapsign_*
-- antes de aplicar em produção. Em staging os campos estão todos NULL.

BEGIN;

-- ─── 1. Remover índice ZapSign ────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_laudos_zapsign_doc_token;

-- ─── 2. Remover colunas ZapSign ──────────────────────────────────────────────
ALTER TABLE public.laudos
  DROP COLUMN IF EXISTS zapsign_doc_token,
  DROP COLUMN IF EXISTS zapsign_signer_token,
  DROP COLUMN IF EXISTS zapsign_status,
  DROP COLUMN IF EXISTS zapsign_sign_url,
  DROP COLUMN IF EXISTS assinado_em;

-- ─── 3. Atualizar CHECK constraint — remover statuses ZapSign ─────────────────
-- Statuses válidos pós-limpeza:
--   rascunho → pdf_gerado → emitido → enviado | erro
ALTER TABLE public.laudos
  DROP CONSTRAINT IF EXISTS chk_laudos_status_valid;

ALTER TABLE public.laudos
  ADD CONSTRAINT chk_laudos_status_valid CHECK (
    (status)::text = ANY (ARRAY[
      'rascunho'::text,
      'pdf_gerado'::text,
      'emitido'::text,
      'enviado'::text,
      'erro'::text
    ])
  );

-- ─── 4. Registrar no schema_migrations ───────────────────────────────────────
INSERT INTO schema_migrations (version, applied_at, description)
VALUES (1248, NOW(), 'cleanup_zapsign_legacy — remove colunas, indice e statuses ZapSign de laudos')
ON CONFLICT (version) DO NOTHING;

COMMIT;
