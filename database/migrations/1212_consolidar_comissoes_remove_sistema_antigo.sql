-- ============================================================================
-- MIGRATION 1212: Consolidar Comissões — Remove Sistema Antigo
-- Data: 2026-04-16
-- Objetivo:
--   1. Cancelar comissões legadas (pendente_nf, nf_em_analise)
--   2. Dropar tabelas do sistema antigo (repasses_split, ciclos_comissao_mensal)
--   3. Dropar enums órfãos (status_repasse_split)
--   4. Adicionar colunas de tracking Asaas em comissoes_laudo
--   5. Corrigir UNIQUE constraint em ciclos_comissao
-- ============================================================================

BEGIN;

-- ====================================================================
-- 1. CANCELAR COMISSÕES LEGADAS (pendente_nf, nf_em_analise)
--    Usa DO block para tratar caso onde enum não tem esses valores
-- ====================================================================

DO $$
BEGIN
  UPDATE comissoes_laudo
  SET status = 'cancelada',
      motivo_congelamento = 'vinculo_encerrado',
      atualizado_em = NOW()
  WHERE status IN ('pendente_nf', 'nf_em_analise');
EXCEPTION WHEN invalid_text_representation THEN
  RAISE NOTICE 'Enum status_comissao não contém pendente_nf/nf_em_analise — pulando cancelamento.';
END $$;

-- ====================================================================
-- 2. DROPAR TABELAS DO SISTEMA ANTIGO
-- ====================================================================

-- 2a. Dropar repasses_split (tem FK para ciclos_comissao_mensal)
DROP TABLE IF EXISTS public.repasses_split CASCADE;

-- 2b. Dropar ciclos_comissao_mensal
DROP TABLE IF EXISTS public.ciclos_comissao_mensal CASCADE;

-- ====================================================================
-- 3. DROPAR ENUMS ÓRFÃOS
-- ====================================================================

DROP TYPE IF EXISTS status_repasse_split CASCADE;
-- Nota: status_ciclo_comissao é o enum do sistema antigo, mas se existem
-- views/funcs que referenciam, dropa com CASCADE para limpar
DROP TYPE IF EXISTS status_ciclo_comissao CASCADE;

-- ====================================================================
-- 4. ADICIONAR COLUNAS DE TRACKING ASAAS em comissoes_laudo
-- ====================================================================

ALTER TABLE comissoes_laudo
  ADD COLUMN IF NOT EXISTS asaas_payment_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS asaas_split_executado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS asaas_split_confirmado_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_comissoes_laudo_asaas_payment
  ON comissoes_laudo (asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL;

COMMENT ON COLUMN comissoes_laudo.asaas_payment_id IS 'ID do pagamento Asaas que originou esta comissão (para rastreio de split).';
COMMENT ON COLUMN comissoes_laudo.asaas_split_executado IS 'Se o split Asaas foi executado na subconta do representante.';
COMMENT ON COLUMN comissoes_laudo.asaas_split_confirmado_em IS 'Timestamp da confirmação do split pelo webhook Asaas.';

-- ====================================================================
-- 5. CORRIGIR UNIQUE CONSTRAINT em ciclos_comissao (se a tabela existir)
-- ====================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ciclos_comissao'
  ) THEN
    -- Dropar a constraint antiga que incluía vendedor_id e tipo_beneficiario
    ALTER TABLE ciclos_comissao
      DROP CONSTRAINT IF EXISTS uq_ciclo_beneficiario_mes;

    -- Criar nova constraint simples: 1 ciclo por representante por mês
    BEGIN
      ALTER TABLE ciclos_comissao
        ADD CONSTRAINT uq_ciclo_rep_mes UNIQUE (representante_id, mes_referencia);
    EXCEPTION WHEN duplicate_table THEN
      RAISE NOTICE 'Constraint uq_ciclo_rep_mes já existe — pulando.';
    END;

    COMMENT ON TABLE ciclos_comissao IS
      'Ciclo de fechamento mensal de comissões (SISTEMA ÚNICO). Status: aberto → fechado → nf_enviada → nf_aprovada → pago.';
  ELSE
    RAISE NOTICE 'Tabela ciclos_comissao não existe — seção 5/6 pulada.';
  END IF;
END $$;

COMMIT;
