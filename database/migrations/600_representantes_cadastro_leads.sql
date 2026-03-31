-- ============================================================================
-- MIGRATION 600: Representantes Cadastro Leads (Landing Page)
-- Descrição: Tabela para armazenar leads de representantes vindos da landing
--            page, com upload de documentos (CPF para PF, CNPJ+CPF resp. para PJ).
-- Data: 2026-03-04
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENUM para status do cadastro lead
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE status_cadastro_lead AS ENUM (
    'pendente_verificacao',  -- Recém enviado, aguardando admin revisar docs
    'verificado',            -- Docs validados, pronto para converter
    'rejeitado',             -- Docs inválidos ou cadastro fraudulento
    'convertido'             -- Já virou representante oficial
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 2. TABELA representantes_cadastro_leads
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.representantes_cadastro_leads (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tipo de pessoa
  tipo_pessoa                     tipo_pessoa_representante NOT NULL,

  -- Dados pessoais / empresariais
  nome                            VARCHAR(200) NOT NULL,
  email                           VARCHAR(200) NOT NULL,
  telefone                        VARCHAR(20)  NOT NULL,

  -- PF: CPF obrigatório
  cpf                             CHAR(11),

  -- PJ: CNPJ + razão social + CPF responsável obrigatórios
  cnpj                            CHAR(14),
  razao_social                    VARCHAR(255),
  cpf_responsavel                 CHAR(11),

  -- Documento PF: arquivo CPF
  doc_cpf_filename                VARCHAR(255),
  doc_cpf_key                     VARCHAR(2048),
  doc_cpf_url                     TEXT,

  -- Documento PJ: cartão CNPJ
  doc_cnpj_filename               VARCHAR(255),
  doc_cnpj_key                    VARCHAR(2048),
  doc_cnpj_url                    TEXT,

  -- Documento PJ: CPF do responsável
  doc_cpf_resp_filename           VARCHAR(255),
  doc_cpf_resp_key                VARCHAR(2048),
  doc_cpf_resp_url                TEXT,

  -- Status e controle
  status                          status_cadastro_lead NOT NULL DEFAULT 'pendente_verificacao',
  motivo_rejeicao                 TEXT,

  -- Metadados de origem (segurança / auditoria)
  ip_origem                       VARCHAR(45),
  user_agent                      TEXT,

  -- Timestamps
  criado_em                       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verificado_em                   TIMESTAMPTZ,
  verificado_por                  VARCHAR(11),   -- CPF do admin que verificou
  convertido_em                   TIMESTAMPTZ,
  representante_id                INTEGER REFERENCES public.representantes(id),

  -- Constraints de validação
  CONSTRAINT cadastro_lead_cpf_valido
    CHECK (cpf ~ '^\d{11}$' OR cpf IS NULL),
  CONSTRAINT cadastro_lead_cnpj_valido
    CHECK (cnpj ~ '^\d{14}$' OR cnpj IS NULL),
  CONSTRAINT cadastro_lead_cpf_resp_valido
    CHECK (cpf_responsavel ~ '^\d{11}$' OR cpf_responsavel IS NULL),
  CONSTRAINT cadastro_lead_pf_tem_cpf
    CHECK (tipo_pessoa = 'pj' OR cpf IS NOT NULL),
  CONSTRAINT cadastro_lead_pj_tem_cnpj
    CHECK (tipo_pessoa = 'pf' OR (cnpj IS NOT NULL AND cpf_responsavel IS NOT NULL AND razao_social IS NOT NULL)),
  CONSTRAINT cadastro_lead_pf_tem_doc_cpf
    CHECK (tipo_pessoa = 'pj' OR doc_cpf_key IS NOT NULL),
  CONSTRAINT cadastro_lead_pj_tem_docs
    CHECK (tipo_pessoa = 'pf' OR (doc_cnpj_key IS NOT NULL AND doc_cpf_resp_key IS NOT NULL))
);

-- ============================================================================
-- 3. ÍNDICES
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_cadastro_leads_email
  ON public.representantes_cadastro_leads (email)
  WHERE status NOT IN ('rejeitado');

CREATE UNIQUE INDEX IF NOT EXISTS idx_cadastro_leads_cpf
  ON public.representantes_cadastro_leads (cpf)
  WHERE cpf IS NOT NULL AND status NOT IN ('rejeitado');

CREATE UNIQUE INDEX IF NOT EXISTS idx_cadastro_leads_cnpj
  ON public.representantes_cadastro_leads (cnpj)
  WHERE cnpj IS NOT NULL AND status NOT IN ('rejeitado');

CREATE INDEX IF NOT EXISTS idx_cadastro_leads_status
  ON public.representantes_cadastro_leads (status);

CREATE INDEX IF NOT EXISTS idx_cadastro_leads_criado_em
  ON public.representantes_cadastro_leads (criado_em DESC);

-- ============================================================================
-- 4. RLS (Row Level Security)
-- ============================================================================
ALTER TABLE public.representantes_cadastro_leads ENABLE ROW LEVEL SECURITY;

-- Admin pode tudo
CREATE POLICY admin_cadastro_leads_all
  ON public.representantes_cadastro_leads
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.user_role', true) = 'admin'
  );

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================
COMMENT ON TABLE public.representantes_cadastro_leads IS
  'Leads de cadastro de representantes vindos da landing page. Admin revisa docs e converte em representante oficial.';

COMMENT ON COLUMN public.representantes_cadastro_leads.doc_cpf_key IS
  'Chave do arquivo no storage (local: storage/representante/{id}/..., prod: rep-qwork/{id}/...)';

COMMENT ON COLUMN public.representantes_cadastro_leads.status IS
  'pendente_verificacao=aguardando admin; verificado=docs ok; rejeitado=negado; convertido=virou representante';

COMMENT ON COLUMN public.representantes_cadastro_leads.representante_id IS
  'FK para representantes: preenchido quando o lead é convertido em representante oficial';

COMMIT;
