-- ============================================================================
-- MIGRATION 600: Novo Modelo de Comissionamento
-- Descrição: Adiciona modelo de comissionamento por % ou custo fixo,
--            subconta Asaas (walletId), ciclos mensais e repasses split.
--            Arquiva registros legados de comissoes_laudo.
-- Data: 2026-04-12
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. NOVOS ENUMs
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE modelo_comissionamento AS ENUM (
    'percentual',  -- % do valor do laudo (max 40% total, mínimo QWork garantido)
    'custo_fixo'   -- QWork fica com o custo mínimo; restante vai ao representante
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_ciclo_comissao AS ENUM (
    'aberto',            -- mês corrente, recebendo repasses via split
    'aguardando_nf_rpa', -- ciclo fechado no dia 1, aguardando NF/RPA até dia 5
    'nf_rpa_enviada',    -- representante enviou NF/RPA, aguardando validação suporte
    'validado',          -- suporte validou NF/RPA (ciclo encerrado)
    'vencido'            -- prazo expirou sem NF/RPA validada (rep bloqueado)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_repasse_split AS ENUM (
    'pendente',    -- aguardando confirmação do gateway
    'confirmado',  -- webhook PAYMENT_CONFIRMED recebido
    'estornado'    -- payment estornado/cancelado
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 2. ESTENDER ENUM status_representante
-- ============================================================================

DO $$ BEGIN
  ALTER TYPE status_representante ADD VALUE IF NOT EXISTS 'aprovacao_comercial';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 3. ADICIONAR COLUNAS EM representantes
-- ============================================================================

ALTER TABLE public.representantes
  ADD COLUMN IF NOT EXISTS modelo_comissionamento modelo_comissionamento,
  ADD COLUMN IF NOT EXISTS asaas_wallet_id        VARCHAR(50);

-- Nota: percentual_comissao já existe na tabela (Migration 500).
-- modelo_comissionamento e asaas_wallet_id ficam NULL até aprovação em 2 estágios.

COMMENT ON COLUMN public.representantes.modelo_comissionamento IS
  'Modelo de comissão definido pelo Comercial no Estágio 1 de aprovação. NULL = ainda não aprovado pelo comercial.';
COMMENT ON COLUMN public.representantes.asaas_wallet_id IS
  'walletId da subconta Asaas criada pelo Suporte no Estágio 2 de aprovação. NULL = subconta ainda não criada.';

-- ============================================================================
-- 4. CRIAR TABELA ciclos_comissao_mensal
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ciclos_comissao_mensal (
  id                    SERIAL         PRIMARY KEY,
  representante_id      INTEGER        NOT NULL REFERENCES public.representantes(id) ON DELETE RESTRICT,
  -- Sempre o dia 1 do mês de referência (ex: '2026-04-01')
  mes_ano               DATE           NOT NULL,
  -- Valor total de split confirmado pelo gateway no mês
  valor_total_recebido  NUMERIC(12,2)  NOT NULL DEFAULT 0,
  status                status_ciclo_comissao NOT NULL DEFAULT 'aberto',
  -- NF/RPA
  nf_rpa_path           VARCHAR(500),
  nf_rpa_nome_arquivo   VARCHAR(255),
  data_envio_nf_rpa     TIMESTAMPTZ,
  -- Validação pelo suporte
  data_validacao_suporte TIMESTAMPTZ,
  validado_por_cpf       VARCHAR(20),
  -- Bloqueio automático (dia 10 sem NF/RPA)
  data_bloqueio         TIMESTAMPTZ,
  -- Auditoria
  criado_em             TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  atualizado_em         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT ciclos_comissao_mensal_unico UNIQUE (representante_id, mes_ano)
);

CREATE INDEX IF NOT EXISTS idx_ciclos_comissao_mensal_rep
  ON public.ciclos_comissao_mensal (representante_id);
CREATE INDEX IF NOT EXISTS idx_ciclos_comissao_mensal_status
  ON public.ciclos_comissao_mensal (status);
CREATE INDEX IF NOT EXISTS idx_ciclos_comissao_mensal_mes
  ON public.ciclos_comissao_mensal (mes_ano);

COMMENT ON TABLE public.ciclos_comissao_mensal IS
  'Fechamento mensal de comissões por representante. Um ciclo por (representante_id, mes_ano).';

-- ============================================================================
-- 5. CRIAR TABELA repasses_split
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.repasses_split (
  id                     SERIAL         PRIMARY KEY,
  representante_id       INTEGER        NOT NULL REFERENCES public.representantes(id) ON DELETE RESTRICT,
  ciclo_id               INTEGER        NOT NULL REFERENCES public.ciclos_comissao_mensal(id) ON DELETE RESTRICT,
  -- Referências ao laudo/vínculo/pagamento
  vinculo_id             INTEGER        REFERENCES public.vinculos_comissao(id) ON DELETE SET NULL,
  laudo_id               INTEGER,
  asaas_payment_id       VARCHAR(50),
  -- Valores
  valor_total_laudo      NUMERIC(12,2)  NOT NULL,
  valor_qwork            NUMERIC(12,2)  NOT NULL,
  valor_representante    NUMERIC(12,2)  NOT NULL,
  -- Modelo aplicado no momento do split
  modelo_utilizado       modelo_comissionamento NOT NULL,
  percentual_aplicado    NUMERIC(5,2),           -- preenchido somente no modelo %
  -- Status do repasse
  status                 status_repasse_split NOT NULL DEFAULT 'pendente',
  -- Auditoria
  data_criacao           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  data_confirmacao       TIMESTAMPTZ,
  data_estorno           TIMESTAMPTZ,
  criado_em              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  atualizado_em          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repasses_split_representante
  ON public.repasses_split (representante_id);
CREATE INDEX IF NOT EXISTS idx_repasses_split_ciclo
  ON public.repasses_split (ciclo_id);
CREATE INDEX IF NOT EXISTS idx_repasses_split_payment
  ON public.repasses_split (asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_repasses_split_status
  ON public.repasses_split (status);

COMMENT ON TABLE public.repasses_split IS
  'Registro de cada repasse de split feito pelo gateway Asaas para a subconta do representante.';

-- ============================================================================
-- 6. ADICIONAR COLUNA arquivado EM comissoes_laudo
-- ============================================================================

ALTER TABLE public.comissoes_laudo
  ADD COLUMN IF NOT EXISTS arquivado BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.comissoes_laudo.arquivado IS
  'TRUE para registros legados (modelo anterior). Não aparecem na UI do novo modelo.';

-- Arquivar todos os registros existentes (modelo legado)
UPDATE public.comissoes_laudo
SET arquivado = TRUE
WHERE arquivado = FALSE;

-- ============================================================================
-- 7. RLS — Habilitar nas novas tabelas
-- ============================================================================

ALTER TABLE public.ciclos_comissao_mensal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repasses_split ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para o backend (service role ignora RLS)
CREATE POLICY "backend_all_ciclos" ON public.ciclos_comissao_mensal
  FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

CREATE POLICY "backend_all_repasses" ON public.repasses_split
  FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

-- ============================================================================
-- 8. TRIGGER updated_at nas novas tabelas
-- ============================================================================

-- Reutiliza o trigger genérico se existir, ou cria função inline
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $fn$
    BEGIN
      NEW.atualizado_em = NOW();
      RETURN NEW;
    END;
    $fn$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_ciclos_atualizado_em ON public.ciclos_comissao_mensal;
CREATE TRIGGER trg_ciclos_atualizado_em
  BEFORE UPDATE ON public.ciclos_comissao_mensal
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_repasses_atualizado_em ON public.repasses_split;
CREATE TRIGGER trg_repasses_atualizado_em
  BEFORE UPDATE ON public.repasses_split
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
