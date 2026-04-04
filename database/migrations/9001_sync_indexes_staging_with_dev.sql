-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 9001: Sincronizar índices do STAGING com DEV (remover obsoletos)
-- DEV = nr-bps_db (fonte da verdade)
-- STAGING = neondb_staging (Neon Cloud)
--
-- Diff:
--   STAGING tem 416 índices, DEV tem 412
--   13 índices extras no STAGING (legados/obsoletos) → DROP
--    9 índices faltando no STAGING (novos no DEV)     → CREATE
--   Resultado: 416 - 13 + 9 = 412 ✅
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

SET search_path = public;
SET client_min_messages = 'notice';

-- ─── PARTE 1: REMOVER ÍNDICES EXTRAS DO STAGING (obsoletos/legados) ───────

-- aceites_termos_entidade — índice em responsavel_cpf não existe no DEV
DROP INDEX IF EXISTS idx_aceites_entidade_responsavel;

-- aceites_termos_usuario — índice em usuario_entidade_id não existe no DEV
DROP INDEX IF EXISTS idx_aceites_usuario_entidade;

-- fila_emissao — DEV só tem o pkey; estes 5 são legados do STAGING
-- fila_emissao_lote_id_unique é CONSTRAINT (não apenas índice) — usar ALTER TABLE
ALTER TABLE fila_emissao DROP CONSTRAINT IF EXISTS fila_emissao_lote_id_unique;
DROP INDEX IF EXISTS idx_fila_emissao_lote_tentativas_pendentes;
DROP INDEX IF EXISTS idx_fila_emissao_proxima_tentativa;
DROP INDEX IF EXISTS idx_fila_lote;
DROP INDEX IF EXISTS idx_fila_pendente;

-- importacoes_clinica — idx_clinica é alias legado de clinica_id; status não existe no DEV
DROP INDEX IF EXISTS idx_importacoes_clinica_clinica;
DROP INDEX IF EXISTS idx_importacoes_clinica_status;

-- laudos — idx_lote_id_status e unico_enviado substituídos no DEV por laudos_lote_emissor_unique
DROP INDEX IF EXISTS idx_laudos_lote_id_status;
DROP INDEX IF EXISTS idx_laudos_unico_enviado;

-- pagamentos — num_funcionarios index não existe no DEV
DROP INDEX IF EXISTS idx_pagamentos_num_funcionarios;

-- tokens_retomada_pagamento — alias legado de idx_tokens_retomada_token (já existe)
DROP INDEX IF EXISTS idx_tokens_token;

-- ─── PARTE 2: CRIAR ÍNDICES FALTANDO NO STAGING (existem no DEV) ──────────

-- auditoria_laudos.lote_id
CREATE INDEX IF NOT EXISTS idx_auditoria_laudos_lote
  ON public.auditoria_laudos USING btree (lote_id);

-- clinicas.entidade_id
CREATE INDEX IF NOT EXISTS idx_clinicas_entidade_id
  ON public.clinicas USING btree (entidade_id);

-- comissoes_laudo.clinica_id (parcial — só quando existe)
CREATE INDEX IF NOT EXISTS idx_comissoes_clinica_id
  ON public.comissoes_laudo USING btree (clinica_id)
  WHERE (clinica_id IS NOT NULL);

-- funcionarios.usuario_tipo (nova coluna adicionada via 9000)
CREATE INDEX IF NOT EXISTS idx_funcionarios_usuario_tipo
  ON public.funcionarios USING btree (usuario_tipo);

-- laudos.hash_pdf (parcial)
CREATE INDEX IF NOT EXISTS idx_laudos_hash_pdf
  ON public.laudos USING btree (hash_pdf)
  WHERE (hash_pdf IS NOT NULL);

-- laudos.relatorio_setor (nova coluna adicionada via 9000)
CREATE INDEX IF NOT EXISTS idx_laudos_relatorio_setor
  ON public.laudos USING btree (relatorio_setor)
  WHERE (relatorio_setor IS NOT NULL);

-- laudos — unique constraint por (lote_id, emissor_cpf)
CREATE UNIQUE INDEX IF NOT EXISTS laudos_lote_emissor_unique
  ON public.laudos USING btree (lote_id, emissor_cpf);

-- laudos_storage_log (tabela criada via 9000 — sem índices extras ainda)
CREATE INDEX IF NOT EXISTS idx_laudos_storage_log_laudo_id
  ON public.laudos_storage_log USING btree (laudo_id);

CREATE INDEX IF NOT EXISTS idx_laudos_storage_log_registrado_em
  ON public.laudos_storage_log USING btree (registrado_em DESC);

-- ─── PARTE 3: VALIDAÇÃO FINAL ─────────────────────────────────────────────

DO $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM pg_indexes WHERE schemaname = 'public';

  IF v_total = 412 THEN
    RAISE NOTICE '✅ Migration 9001 concluída — STAGING indexes sincronizados com DEV (total: %)', v_total;
  ELSE
    RAISE NOTICE '⚠️  Migration 9001 concluída mas total de indexes = % (esperado: 412)', v_total;
  END IF;
END $$;

COMMIT;
