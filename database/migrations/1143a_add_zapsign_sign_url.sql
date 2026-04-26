-- Migration 1143: ZapSign — sign_url + status assinado_processando
-- 1. Adiciona coluna zapsign_sign_url para armazenar URL real de assinatura
-- 2. Adiciona status 'assinado_processando' para eliminar janela de inconsistência
--    entre FASE A (hash gravado) e FASE B (status=enviado) do webhook.

-- 1. Adicionar coluna sign_url
ALTER TABLE laudos
  ADD COLUMN IF NOT EXISTS zapsign_sign_url TEXT;

COMMENT ON COLUMN laudos.zapsign_sign_url IS
  'URL direta de assinatura retornada pelo ZapSign. Usada como fallback caso o email não chegue ao assinante.';

-- 2. Ampliar CHECK constraint para incluir 'assinado_processando'
ALTER TABLE laudos DROP CONSTRAINT IF EXISTS chk_laudos_status_valid;

ALTER TABLE laudos ADD CONSTRAINT chk_laudos_status_valid
  CHECK (status IN (
    'rascunho',
    'pdf_gerado',
    'aguardando_assinatura',
    'assinado_processando',
    'emitido',
    'enviado'
  ));
