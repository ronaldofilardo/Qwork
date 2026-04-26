-- Migration 1209: Completar percentual_comissao_comercial em vinculos/comissoes + requer_aprovacao_suporte + remoção PF
-- Contexto:
--   1a. percentual_comissao_comercial faltava em vinculos_comissao e comissoes_laudo
--   1b. CHECK constraint soma percRep + percComercial ≤ 40 em leads_representante
--   1c. requer_aprovacao_suporte para duplo fluxo de aprovação
--   1d. Remoção cascata de representantes PF + bloqueio do ENUM
-- Data: 2026-04-15

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1a. ADD percentual_comissao_comercial em vinculos_comissao e comissoes_laudo
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE vinculos_comissao
  ADD COLUMN IF NOT EXISTS percentual_comissao_comercial NUMERIC(5,2) NOT NULL DEFAULT 0
    CONSTRAINT vinculos_perc_comercial_range CHECK (percentual_comissao_comercial >= 0 AND percentual_comissao_comercial <= 40);

COMMENT ON COLUMN vinculos_comissao.percentual_comissao_comercial IS
  'Percentual de comissão do comercial copiado do representante no momento da criação do vínculo.';

ALTER TABLE comissoes_laudo
  ADD COLUMN IF NOT EXISTS percentual_comissao_comercial NUMERIC(5,2) NOT NULL DEFAULT 0
    CONSTRAINT comissoes_perc_comercial_range CHECK (percentual_comissao_comercial >= 0 AND percentual_comissao_comercial <= 40);

ALTER TABLE comissoes_laudo
  ADD COLUMN IF NOT EXISTS valor_comissao_comercial NUMERIC(15,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN comissoes_laudo.percentual_comissao_comercial IS
  'Percentual de comissão do comercial aplicado nesta comissão.';
COMMENT ON COLUMN comissoes_laudo.valor_comissao_comercial IS
  'Valor em R$ da comissão do comercial para este laudo (baseCalculo × percentual_comissao_comercial / 100).';

-- ═══════════════════════════════════════════════════════════════════════════
-- 1b. CHECK constraint soma percRep + percComercial ≤ 40 em leads_representante
-- ═══════════════════════════════════════════════════════════════════════════

-- Tenta dropar a constraint se existir (idempotente)
DO $$
BEGIN
  ALTER TABLE leads_representante DROP CONSTRAINT IF EXISTS chk_leads_perc_total_max;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

ALTER TABLE leads_representante
  ADD CONSTRAINT chk_leads_perc_total_max
    CHECK (COALESCE(percentual_comissao_representante, 0) + COALESCE(percentual_comissao_comercial, 0) <= 40);

-- ═══════════════════════════════════════════════════════════════════════════
-- 1c. requer_aprovacao_suporte
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE leads_representante
  ADD COLUMN IF NOT EXISTS requer_aprovacao_suporte BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN leads_representante.requer_aprovacao_suporte IS
  'true quando o valor QWork fica abaixo do custo mínimo por avaliação (R$5 clínica / R$12 entidade). Requer aprovação do suporte além do comercial.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 1d. Remoção cascata de representantes PF + bloqueio do valor no ENUM
-- ═══════════════════════════════════════════════════════════════════════════

-- 1d.1 Deletar dados dependentes de reps PF (cascata manual)
DELETE FROM repasses_split
  WHERE representante_id IN (SELECT id FROM representantes WHERE tipo_pessoa = 'pf');

DELETE FROM comissoes_laudo
  WHERE representante_id IN (SELECT id FROM representantes WHERE tipo_pessoa = 'pf');

DELETE FROM vinculos_comissao
  WHERE representante_id IN (SELECT id FROM representantes WHERE tipo_pessoa = 'pf');

DELETE FROM leads_representante
  WHERE representante_id IN (SELECT id FROM representantes WHERE tipo_pessoa = 'pf');

-- Deletar os representantes PF
DELETE FROM representantes WHERE tipo_pessoa = 'pf';

-- 1d.2 Adicionar CHECK que impede novos PF (mais seguro que alterar ENUM)
DO $$
BEGIN
  ALTER TABLE representantes DROP CONSTRAINT IF EXISTS representantes_somente_pj;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

ALTER TABLE representantes
  ADD CONSTRAINT representantes_somente_pj CHECK (tipo_pessoa = 'pj');

-- 1d.3 Remover constraint PF (agora irrelevante)
DO $$
BEGIN
  ALTER TABLE representantes DROP CONSTRAINT IF EXISTS representante_pf_tem_cpf;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

COMMIT;
