-- =============================================================================
-- Migration Patch 1210: Sincronizar PROD (neondb_v2) com STAGING (neondb_staging)
-- Criado em: 2026-04-25
-- Objetivo: Aplicar colunas e tabelas faltantes identificadas no diff pós-migração
-- IDEMPOTENTE: seguro para re-executar (IF NOT EXISTS em todos os lugares)
-- =============================================================================

-- ============================================================
-- 1. TIPOS ENUM FALTANTES NO PROD
-- ============================================================

-- modelo_comissionamento (usado em representantes e leads_representante)
DO $$ BEGIN
  CREATE TYPE modelo_comissionamento AS ENUM ('percentual', 'custo_fixo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- usuario_tipo_enum (usado em funcionarios.usuario_tipo e usuarios.tipo_usuario)
DO $$ BEGIN
  CREATE TYPE usuario_tipo_enum AS ENUM (
    'funcionario_clinica',
    'funcionario_entidade',
    'gestor',
    'rh',
    'admin',
    'emissor',
    'suporte',
    'comercial',
    'vendedor'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. COLUNAS FALTANTES EM TABELAS EXISTENTES
-- ============================================================

-- clinicas: isento_pagamento (STAGING tem 45 colunas, PROD tem 44 — faltou isento_pagamento)
ALTER TABLE clinicas ADD COLUMN IF NOT EXISTS isento_pagamento boolean NOT NULL DEFAULT false;

-- entidades: isento_pagamento (mesma lógica)
ALTER TABLE entidades ADD COLUMN IF NOT EXISTS isento_pagamento boolean NOT NULL DEFAULT false;

-- funcionarios: usuario_tipo
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS usuario_tipo usuario_tipo_enum;

-- laudos: colunas ZapSign e assinatura
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS zapsign_doc_token character varying;
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS zapsign_signer_token character varying;
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS zapsign_status character varying;
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS assinado_em timestamp with time zone;
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS pdf_gerado_em timestamp with time zone;
ALTER TABLE laudos ADD COLUMN IF NOT EXISTS zapsign_sign_url text;

-- leads_representante: snapshot e modelo de comissionamento
ALTER TABLE leads_representante ADD COLUMN IF NOT EXISTS valor_custo_fixo_snapshot numeric;
ALTER TABLE leads_representante ADD COLUMN IF NOT EXISTS modelo_comissionamento modelo_comissionamento;

-- rate_limit_entries: created_at
ALTER TABLE rate_limit_entries ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();

-- representantes: colunas de comissionamento e wallet
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS modelo_comissionamento modelo_comissionamento;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS asaas_wallet_id character varying;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS valor_custo_fixo_entidade numeric;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS valor_custo_fixo_clinica numeric;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS gestor_comercial_cpf character varying;

-- representantes_cadastro_leads: wallet_id
ALTER TABLE representantes_cadastro_leads ADD COLUMN IF NOT EXISTS asaas_wallet_id character varying;

-- usuarios: perfil profissional e wallet
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS crp character varying;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS titulo_profissional character varying;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS asaas_wallet_id character varying;

-- ============================================================
-- 3. TABELAS FALTANTES NO PROD
-- ============================================================

-- 3.1 auditoria_sociedade_pagamentos
CREATE TABLE IF NOT EXISTS auditoria_sociedade_pagamentos (
    id integer NOT NULL,
    pagamento_id integer,
    asaas_payment_id character varying(80),
    tomador_id integer,
    lote_id integer,
    modo_operacao character varying(20) DEFAULT 'simulacao' NOT NULL,
    status character varying(30) DEFAULT 'calculado' NOT NULL,
    valor_bruto numeric(12,2) DEFAULT 0 NOT NULL,
    valor_impostos numeric(12,2) DEFAULT 0 NOT NULL,
    valor_representante numeric(12,2) DEFAULT 0 NOT NULL,
    valor_comercial numeric(12,2) DEFAULT 0 NOT NULL,
    valor_socio_ronaldo numeric(12,2) DEFAULT 0 NOT NULL,
    valor_socio_antonio numeric(12,2) DEFAULT 0 NOT NULL,
    detalhes jsonb DEFAULT '{}' NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name='auditoria_sociedade_pagamentos_id_seq') THEN
    CREATE SEQUENCE auditoria_sociedade_pagamentos_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE auditoria_sociedade_pagamentos_id_seq OWNED BY auditoria_sociedade_pagamentos.id;
  END IF;
END $$;

ALTER TABLE auditoria_sociedade_pagamentos ALTER COLUMN id SET DEFAULT nextval('auditoria_sociedade_pagamentos_id_seq'::regclass);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='auditoria_sociedade_pagamentos_pkey') THEN
    ALTER TABLE auditoria_sociedade_pagamentos ADD CONSTRAINT auditoria_sociedade_pagamentos_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='auditoria_sociedade_pagamentos_pagamento_id_fkey') THEN
    ALTER TABLE auditoria_sociedade_pagamentos ADD CONSTRAINT auditoria_sociedade_pagamentos_pagamento_id_fkey FOREIGN KEY (pagamento_id) REFERENCES pagamentos(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_auditoria_sociedade_pagamentos_criado_em ON auditoria_sociedade_pagamentos USING btree (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_sociedade_pagamentos_payment ON auditoria_sociedade_pagamentos USING btree (asaas_payment_id);

-- 3.2 beneficiarios_sociedade
CREATE TABLE IF NOT EXISTS beneficiarios_sociedade (
    id integer NOT NULL,
    codigo character varying(30) NOT NULL,
    nome character varying(150) NOT NULL,
    nome_empresarial character varying(200),
    documento_fiscal character varying(30),
    asaas_wallet_id character varying(100),
    percentual_participacao numeric(5,2) DEFAULT 50 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    observacoes text,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name='beneficiarios_sociedade_id_seq') THEN
    CREATE SEQUENCE beneficiarios_sociedade_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE beneficiarios_sociedade_id_seq OWNED BY beneficiarios_sociedade.id;
  END IF;
END $$;

ALTER TABLE beneficiarios_sociedade ALTER COLUMN id SET DEFAULT nextval('beneficiarios_sociedade_id_seq'::regclass);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='beneficiarios_sociedade_pkey') THEN
    ALTER TABLE beneficiarios_sociedade ADD CONSTRAINT beneficiarios_sociedade_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='beneficiarios_sociedade_codigo_key') THEN
    ALTER TABLE beneficiarios_sociedade ADD CONSTRAINT beneficiarios_sociedade_codigo_key UNIQUE (codigo);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_beneficiarios_sociedade_codigo ON beneficiarios_sociedade USING btree (codigo);

-- 3.3 configuracoes_gateway
CREATE TABLE IF NOT EXISTS configuracoes_gateway (
    codigo character varying(40) NOT NULL,
    descricao character varying(100),
    tipo character varying(20) NOT NULL,
    valor numeric(10,4) DEFAULT 0 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT configuracoes_gateway_tipo_check CHECK ((tipo = ANY (ARRAY['taxa_fixa', 'percentual'])))
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='configuracoes_gateway_pkey') THEN
    ALTER TABLE configuracoes_gateway ADD CONSTRAINT configuracoes_gateway_pkey PRIMARY KEY (codigo);
  END IF;
END $$;

-- 3.4 importacao_templates
CREATE TABLE IF NOT EXISTS importacao_templates (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    clinica_id integer,
    entidade_id integer,
    criado_por_cpf character varying(11) NOT NULL,
    mapeamentos jsonb NOT NULL,
    nivel_cargo_map jsonb,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_importacao_template_tenant CHECK (
        ((clinica_id IS NOT NULL) AND (entidade_id IS NULL)) OR
        ((clinica_id IS NULL) AND (entidade_id IS NOT NULL))
    )
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name='importacao_templates_id_seq') THEN
    CREATE SEQUENCE importacao_templates_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE importacao_templates_id_seq OWNED BY importacao_templates.id;
  END IF;
END $$;

ALTER TABLE importacao_templates ALTER COLUMN id SET DEFAULT nextval('importacao_templates_id_seq'::regclass);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='importacao_templates_pkey') THEN
    ALTER TABLE importacao_templates ADD CONSTRAINT importacao_templates_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='importacao_templates_clinica_id_fkey') THEN
    ALTER TABLE importacao_templates ADD CONSTRAINT importacao_templates_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='importacao_templates_entidade_id_fkey') THEN
    ALTER TABLE importacao_templates ADD CONSTRAINT importacao_templates_entidade_id_fkey FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_importacao_templates_clinica_cpf ON importacao_templates USING btree (clinica_id, criado_por_cpf) WHERE (clinica_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_importacao_templates_entidade_cpf ON importacao_templates USING btree (entidade_id, criado_por_cpf) WHERE (entidade_id IS NOT NULL);

-- ============================================================
-- 4. DROPAR TABELA LEGACY DO PROD
-- ============================================================

DROP TABLE IF EXISTS confirmacao_identidade CASCADE;

-- ============================================================
-- 5. REGISTRAR MIGRAÇÃO NA TABELA schema_migrations
-- ============================================================

INSERT INTO schema_migrations (version, dirty) VALUES (1210, false) ON CONFLICT DO NOTHING;
