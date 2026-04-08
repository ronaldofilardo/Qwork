-- ====================================================================
-- Migration 1040: Reset de senha via link — Admin → Perfis Especiais
-- Data: 2026-04-08
-- Objetivo: Adicionar colunas de token de reset de senha nas tabelas
--   `usuarios` (suporte, comercial, rh, gestor) e `representantes`.
--   O fluxo:
--     1. Admin gera token → usuário fica inativo
--     2. Usuário acessa link público → cria nova senha → fica ativo
-- ====================================================================

BEGIN;

-- ─── Tabela `usuarios` (suporte, comercial, rh, gestor, emissor) ──────────────

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS reset_token             VARCHAR(64),
  ADD COLUMN IF NOT EXISTS reset_token_expira_em   TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS reset_tentativas_falhas SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reset_usado_em          TIMESTAMP WITHOUT TIME ZONE;

-- Índice parcial para lookup rápido por token (somente quando há token ativo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_reset_token
  ON usuarios (reset_token)
  WHERE reset_token IS NOT NULL;

-- ─── Tabela `representantes` ──────────────────────────────────────────────────
-- Representantes têm tabela separada e campo status (não booleano).
-- Já possuem convite_token etc. do fluxo de convite;
-- adicionamos colunas análogas para reset de senha.

ALTER TABLE representantes
  ADD COLUMN IF NOT EXISTS reset_token             VARCHAR(64),
  ADD COLUMN IF NOT EXISTS reset_token_expira_em   TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS reset_tentativas_falhas SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reset_usado_em          TIMESTAMP WITHOUT TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_representantes_reset_token
  ON representantes (reset_token)
  WHERE reset_token IS NOT NULL;

COMMENT ON COLUMN usuarios.reset_token             IS 'Token de 64 chars hex gerado pelo admin para reset de senha';
COMMENT ON COLUMN usuarios.reset_token_expira_em   IS 'Expiração do token (7 dias após geração)';
COMMENT ON COLUMN usuarios.reset_tentativas_falhas IS 'Tentativas falhas de uso do token (bloqueio após 3)';
COMMENT ON COLUMN usuarios.reset_usado_em          IS 'Data/hora em que o token foi usado (token inválido após isso)';

COMMENT ON COLUMN representantes.reset_token             IS 'Token de 64 chars hex para reset de senha via admin';
COMMENT ON COLUMN representantes.reset_token_expira_em   IS 'Expiração do token (7 dias)';
COMMENT ON COLUMN representantes.reset_tentativas_falhas IS 'Tentativas falhas (bloqueio após 3)';
COMMENT ON COLUMN representantes.reset_usado_em          IS 'Data de uso do token';

COMMIT;
