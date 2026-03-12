-- ============================================================================
-- MIGRATION 500: Sistema de Comissionamento
-- Descrição: Tabelas, tipos, índices, RLS e triggers para o módulo de
--            comissionamento via representantes comerciais independentes.
-- Data: 2026-03-02
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- Status do Representante
DO $$ BEGIN
  CREATE TYPE status_representante AS ENUM (
    'ativo',            -- Recém cadastrado, pode indicar, mas comissões não são pagas
    'apto_pendente',    -- Aguardando análise documental pelo Admin
    'apto',             -- Aprovado, comissões fluem normalmente
    'apto_bloqueado',   -- PJ cadastrada com CPF de PF existente, aguarda resolução Admin
    'suspenso',         -- Suspenso por Admin, vínculos e comissões congelados
    'desativado',       -- Encerrado permanentemente
    'rejeitado'         -- Cadastro rejeitado pelo Admin
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tipo de pessoa do Representante
DO $$ BEGIN
  CREATE TYPE tipo_pessoa_representante AS ENUM (
    'pf',  -- Pessoa Física (usa RPA)
    'pj'   -- Pessoa Jurídica (emite NF)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Status do Lead / Indicação
DO $$ BEGIN
  CREATE TYPE status_lead AS ENUM (
    'pendente',    -- CNPJ registrado, aguardando cadastro do cliente
    'convertido',  -- Cliente se cadastrou dentro de 90 dias
    'expirado'     -- 90 dias passaram sem cadastro, CNPJ liberado
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tipo de conversão do Lead
DO $$ BEGIN
  CREATE TYPE tipo_conversao_lead AS ENUM (
    'link_representante',  -- Cliente usou o link/token gerado
    'codigo_representante', -- Cliente inseriu código manualmente no cadastro
    'verificacao_cnpj'     -- Sistema detectou CNPJ na lista, cadastro direto
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Status do Vínculo de Comissão
DO $$ BEGIN
  CREATE TYPE status_vinculo AS ENUM (
    'ativo',               -- Operando, gerando comissões
    'inativo',             -- Sem laudos há ≥ 90 dias, mas pode renovar
    'suspenso',            -- Representante suspenso, comissões pausadas
    'encerrado'            -- Terminado (contrato QWork cancelado, rep desativado ou expirou)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Status da Comissão
DO $$ BEGIN
  CREATE TYPE status_comissao AS ENUM (
    'retida',                    -- Rep está ativo/apto_pendente, aguardando virar 'apto'
    'aprovada',                  -- Pronto para ciclo NF/RPA
    'congelada_rep_suspenso',    -- Rep suspenso, comissão pausada
    'congelada_aguardando_admin',-- Aguardando decisão do Admin (NF, vínculo encerrado, etc.)
    'liberada',                  -- Admin aprovou NF, aguardando transferência
    'paga',                      -- Transferência confirmada
    'cancelada'                  -- Laudo cancelado, vínculo encerrado ou SLA expirado
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Motivo de congelamento de comissão
DO $$ BEGIN
  CREATE TYPE motivo_congelamento AS ENUM (
    'vinculo_encerrado',      -- Vínculo foi encerrado (cancelamento QWork, expiração)
    'rep_suspenso',           -- Representante foi suspenso
    'nf_rpa_pendente',        -- NF/RPA não entregue no prazo
    'nf_rpa_rejeitada',       -- NF/RPA foi rejeitada pelo Admin
    'aguardando_revisao'      -- Em revisão administrativa
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 2. TABELAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 Representantes Comerciais
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.representantes (
  id                        SERIAL PRIMARY KEY,

  -- Identificação
  tipo_pessoa               tipo_pessoa_representante NOT NULL DEFAULT 'pf',
  nome                      VARCHAR(150) NOT NULL,
  email                     VARCHAR(150) NOT NULL UNIQUE,
  telefone                  VARCHAR(20)  NOT NULL,

  -- PF: CPF obrigatório; PJ: CNPJ obrigatório, CPF responsável obrigatório
  cpf                       CHAR(11)     UNIQUE,    -- PF
  cnpj                      CHAR(14)     UNIQUE,    -- PJ
  cpf_responsavel_pj        CHAR(11),               -- PJ: CPF do responsável

  -- Código público único de rastreamento (alfanumérico, ex: K7X2Q9P3)
  codigo                    VARCHAR(12)  NOT NULL UNIQUE,

  -- Dados bancários para recebimento
  banco_codigo              VARCHAR(5),
  agencia                   VARCHAR(10),
  conta                     VARCHAR(20),
  tipo_conta                VARCHAR(20),  -- corrente, poupança
  titular_conta             VARCHAR(150),
  pix_chave                 VARCHAR(150),
  pix_tipo                  VARCHAR(20),  -- cpf, cnpj, email, telefone, aleatoria

  -- Documentação (caminhos para storage)
  doc_identificacao_path    TEXT,         -- RG/CNH para PF; Contrato social para PJ
  comprovante_conta_path    TEXT,

  -- Status e controle
  status                    status_representante NOT NULL DEFAULT 'ativo',
  aceite_termos             BOOLEAN NOT NULL DEFAULT FALSE,
  aceite_termos_em          TIMESTAMPTZ,
  aceite_disclaimer_nv      BOOLEAN NOT NULL DEFAULT FALSE, -- não vínculo empregatício
  aceite_disclaimer_nv_em   TIMESTAMPTZ,

  -- Conflito PF/PJ
  bloqueio_conflito_pf_id   INTEGER REFERENCES public.representantes(id), -- PF que conflita com esta PJ

  -- Auditoria
  criado_em                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  aprovado_em               TIMESTAMPTZ,
  aprovado_por_cpf          CHAR(11),

  CONSTRAINT representante_cpf_valido
    CHECK (cpf ~ '^\d{11}$' OR cpf IS NULL),
  CONSTRAINT representante_cnpj_valido
    CHECK (cnpj ~ '^\d{14}$' OR cnpj IS NULL),
  CONSTRAINT representante_cpf_responsavel_valido
    CHECK (cpf_responsavel_pj ~ '^\d{11}$' OR cpf_responsavel_pj IS NULL),
  CONSTRAINT representante_pf_tem_cpf
    CHECK (tipo_pessoa = 'pj' OR cpf IS NOT NULL),
  CONSTRAINT representante_pj_tem_cnpj
    CHECK (tipo_pessoa = 'pf' OR cnpj IS NOT NULL),
  CONSTRAINT representante_pj_tem_cpf_responsavel
    CHECK (tipo_pessoa = 'pf' OR cpf_responsavel_pj IS NOT NULL)
);

COMMENT ON TABLE  public.representantes IS 'Representantes comerciais independentes que indicam clínicas/entidades ao QWork';
COMMENT ON COLUMN public.representantes.codigo IS 'Código único público do representante (alfanumérico, ex: K7X2Q9P3), usado no formulário de cadastro de clientes';
COMMENT ON COLUMN public.representantes.status IS 'ativo=pode indicar; apto_pendente=docs em análise; apto=recebe comissão; suspenso=tudo pausado; desativado=encerrado';
COMMENT ON COLUMN public.representantes.tipo_pessoa IS 'pf: emite RPA; pj: emite NF de Serviços';

-- ----------------------------------------------------------------------------
-- 2.2 Leads (Indicações pré-cadastro)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads_representante (
  id                        SERIAL PRIMARY KEY,
  representante_id          INTEGER NOT NULL REFERENCES public.representantes(id) ON DELETE RESTRICT,

  -- Empresa indicada (ainda não cadastrada no momento da criação do lead)
  cnpj                      CHAR(14) NOT NULL,
  razao_social              VARCHAR(200),
  contato_nome              VARCHAR(150),
  contato_email             VARCHAR(150),
  contato_telefone          VARCHAR(20),

  -- Controle de prazo (90 dias exatos a partir da criação)
  criado_em                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_expiracao            TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),

  -- Status do lead
  status                    status_lead NOT NULL DEFAULT 'pendente',
  tipo_conversao            tipo_conversao_lead,

  -- Preenchido quando convertido
  entidade_id               INTEGER REFERENCES public.entidades(id) ON DELETE SET NULL,
  data_conversao            TIMESTAMPTZ,

  -- Token de link de convite (gerado on-demand, expira também em 90 dias)
  token_atual               VARCHAR(64) UNIQUE,
  token_gerado_em           TIMESTAMPTZ,
  token_expiracao           TIMESTAMPTZ,

  -- Auditoria
  atualizado_em             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT lead_cnpj_valido
    CHECK (cnpj ~ '^\d{14}$')
);

COMMENT ON TABLE  public.leads_representante IS 'Leads de indicação criados pelo representante. Um CNPJ só pode ter um lead ativo por vez. Após 90 dias sem conversão, o lead expira e o CNPJ fica livre para nova indicação.';
COMMENT ON COLUMN public.leads_representante.data_expiracao IS 'data_criacao + INTERVAL 90 days — exato, com hora. Expira no mesmo horário que foi criado.';
COMMENT ON COLUMN public.leads_representante.token_atual IS 'Token on-demand gerado quando rep clica "Copiar link". Expira em 90 dias a partir de token_gerado_em';
COMMENT ON COLUMN public.leads_representante.entidade_id IS 'FK para entidades: preenchido quando a clínica/entidade conclui o cadastro';

-- Índice parcial para garantir unicidade de CNPJ com lead ativo
CREATE UNIQUE INDEX IF NOT EXISTS leads_cnpj_ativo_unique
  ON public.leads_representante (cnpj)
  WHERE status = 'pendente';

-- ----------------------------------------------------------------------------
-- 2.3 Vínculos de Comissão (Contrato Rep × Entidade/Clínica)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vinculos_comissao (
  id                     SERIAL PRIMARY KEY,
  representante_id       INTEGER NOT NULL REFERENCES public.representantes(id) ON DELETE RESTRICT,
  entidade_id            INTEGER NOT NULL REFERENCES public.entidades(id) ON DELETE RESTRICT,
  lead_id                INTEGER REFERENCES public.leads_representante(id) ON DELETE SET NULL,

  -- Período do vínculo (1 ano a partir da conclusão do cadastro do cliente)
  data_inicio            DATE NOT NULL,
  data_expiracao         DATE NOT NULL,  -- data_inicio + 1 year (midnight 00:00)

  -- Status
  status                 status_vinculo NOT NULL DEFAULT 'ativo',

  -- Controle de inatividade (sem laudos ≥ 90 dias → inativo; JOB diário)
  ultimo_laudo_em        TIMESTAMPTZ,

  -- Auditoria
  criado_em              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  encerrado_em           TIMESTAMPTZ,
  encerrado_motivo       TEXT,

  CONSTRAINT vinculo_datas_validas
    CHECK (data_expiracao > data_inicio),
  CONSTRAINT vinculo_unico_ativo
    UNIQUE (representante_id, entidade_id)  -- Um rep só tem um vínculo por entidade
);

COMMENT ON TABLE  public.vinculos_comissao IS 'Vínculo entre representante e entidade/clínica que gera direito a comissão. Dura 1 ano da data de cadastro do cliente; renovável manualmente.';
COMMENT ON COLUMN public.vinculos_comissao.data_expiracao IS 'data_inicio + INTERVAL 1 year. Sistema bloqueia renovação após expiração (23:59 do dia anterior = último minuto válido).';
COMMENT ON COLUMN public.vinculos_comissao.ultimo_laudo_em IS 'Atualizado pelo trigger sempre que um laudo vinculado é emitido. JOB diário verifica: se NOW() - ultimo_laudo_em ≥ 90 dias → vínculo vira inativo.';

-- ----------------------------------------------------------------------------
-- 2.4 Comissões por Laudo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comissoes_laudo (
  id                        SERIAL PRIMARY KEY,
  vinculo_id                INTEGER NOT NULL REFERENCES public.vinculos_comissao(id) ON DELETE RESTRICT,
  representante_id          INTEGER NOT NULL REFERENCES public.representantes(id) ON DELETE RESTRICT,
  entidade_id               INTEGER NOT NULL REFERENCES public.entidades(id) ON DELETE RESTRICT,
  laudo_id                  INTEGER NOT NULL REFERENCES public.laudos(id) ON DELETE RESTRICT,

  -- Valores
  percentual_comissao       DECIMAL(5,2) NOT NULL DEFAULT 2.50,
  valor_laudo               DECIMAL(10,2) NOT NULL,
  valor_comissao            DECIMAL(10,2) NOT NULL,

  -- Status
  status                    status_comissao NOT NULL DEFAULT 'retida',
  motivo_congelamento       motivo_congelamento,

  -- Ciclo de pagamento (determinado pelo mês de emissão do laudo)
  mes_emissao               DATE NOT NULL,  -- primeiro dia do mês de emissão
  mes_pagamento             DATE,           -- primeiro dia do mês previsto de pagamento

  -- Datas de transição
  data_emissao_laudo        TIMESTAMPTZ NOT NULL,
  data_aprovacao            TIMESTAMPTZ,  -- quando virou 'aprovada'
  data_liberacao            TIMESTAMPTZ,  -- quando Admin aprovou NF e liberou
  data_pagamento            TIMESTAMPTZ,  -- quando Admin confirmou pagamento

  -- NF/RPA
  nf_rpa_enviada_em         TIMESTAMPTZ,
  nf_rpa_aprovada_em        TIMESTAMPTZ,
  nf_rpa_rejeitada_em       TIMESTAMPTZ,
  nf_rpa_motivo_rejeicao    TEXT,
  comprovante_pagamento_path TEXT,

  -- SLA controle
  sla_admin_aviso_em        TIMESTAMPTZ,  -- quando enviou aviso de SLA vencido
  auto_cancelamento_em      TIMESTAMPTZ,  -- data prevista de auto-cancelamento (congelada + 30 dias)

  -- Auditoria
  criado_em                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.comissoes_laudo IS 'Comissão gerada para um representante a cada laudo emitido e pago. Status: retida→aprovada→congelada→liberada→paga ou cancelada.';
COMMENT ON COLUMN public.comissoes_laudo.mes_emissao IS 'Primeiro dia do mês em que o laudo foi emitido (ex: 2026-03-01 para laudos de março/2026).';
COMMENT ON COLUMN public.comissoes_laudo.mes_pagamento IS 'Primeiro dia do mês em que o Admin deve pagar. Determinado pela regra do corte (dia 5).';
COMMENT ON COLUMN public.comissoes_laudo.auto_cancelamento_em IS 'Se congelada_aguardando_admin por 30 dias sem decisão, comissão é auto-cancelada. Pode ser revertida em 30 dias adicionais.';

-- ----------------------------------------------------------------------------
-- 2.5 Auditoria de Transições de Status
-- Rastreia cada mudança de status em qualquer entidade do módulo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comissionamento_auditoria (
  id                BIGSERIAL PRIMARY KEY,
  tabela            VARCHAR(50) NOT NULL,    -- representantes, vinculos_comissao, comissoes_laudo
  registro_id       INTEGER NOT NULL,
  status_anterior   VARCHAR(60),
  status_novo       VARCHAR(60) NOT NULL,
  triggador         VARCHAR(30) NOT NULL,    -- job, admin_action, rep_action, sistema
  motivo            TEXT,
  dados_extras      JSONB,
  criado_por_cpf    CHAR(11),
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.comissionamento_auditoria IS 'Log imutável de todas as transições de status no módulo de comissionamento';

-- ============================================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Representantes
CREATE INDEX IF NOT EXISTS idx_representantes_status
  ON public.representantes (status);
CREATE INDEX IF NOT EXISTS idx_representantes_codigo
  ON public.representantes (codigo);
CREATE INDEX IF NOT EXISTS idx_representantes_cpf
  ON public.representantes (cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_representantes_cnpj
  ON public.representantes (cnpj) WHERE cnpj IS NOT NULL;

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_representante_id
  ON public.leads_representante (representante_id);
CREATE INDEX IF NOT EXISTS idx_leads_cnpj
  ON public.leads_representante (cnpj);
CREATE INDEX IF NOT EXISTS idx_leads_status
  ON public.leads_representante (status);
CREATE INDEX IF NOT EXISTS idx_leads_data_expiracao
  ON public.leads_representante (data_expiracao);
CREATE INDEX IF NOT EXISTS idx_leads_entidade_id
  ON public.leads_representante (entidade_id) WHERE entidade_id IS NOT NULL;

-- Vínculos
CREATE INDEX IF NOT EXISTS idx_vinculos_representante_id
  ON public.vinculos_comissao (representante_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_entidade_id
  ON public.vinculos_comissao (entidade_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_status
  ON public.vinculos_comissao (status);
CREATE INDEX IF NOT EXISTS idx_vinculos_data_expiracao
  ON public.vinculos_comissao (data_expiracao);

-- Comissões
CREATE INDEX IF NOT EXISTS idx_comissoes_vinculo_id
  ON public.comissoes_laudo (vinculo_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_representante_id
  ON public.comissoes_laudo (representante_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_status
  ON public.comissoes_laudo (status);
CREATE INDEX IF NOT EXISTS idx_comissoes_mes_pagamento
  ON public.comissoes_laudo (mes_pagamento);
CREATE INDEX IF NOT EXISTS idx_comissoes_laudo_id
  ON public.comissoes_laudo (laudo_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_auto_cancelamento
  ON public.comissoes_laudo (auto_cancelamento_em)
  WHERE status = 'congelada_aguardando_admin';

-- Auditoria
CREATE INDEX IF NOT EXISTS idx_comissionamento_auditoria_tabela_id
  ON public.comissionamento_auditoria (tabela, registro_id);
CREATE INDEX IF NOT EXISTS idx_comissionamento_auditoria_criado_em
  ON public.comissionamento_auditoria (criado_em DESC);

-- ============================================================================
-- 4. FUNÇÕES HELPER
-- ============================================================================

-- Função: Current representante ID (analogo a current_user_clinica_id)
CREATE OR REPLACE FUNCTION public.current_representante_id()
  RETURNS INTEGER AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_representante_id', TRUE), '')::INTEGER;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_representante_id() IS
  'Contexto de sessão do representante logado. Setado via SET LOCAL antes de queries';

-- Função: Gerar código único para representante (alfanumérico 8 chars)
CREATE OR REPLACE FUNCTION public.gerar_codigo_representante()
  RETURNS VARCHAR(12) AS $$
DECLARE
  _chars  TEXT    := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  _code   TEXT    := '';
  _i      INT;
  _exists BOOLEAN := TRUE;
BEGIN
  WHILE _exists LOOP
    _code := '';
    FOR _i IN 1..8 LOOP
      _code := _code || SUBSTR(_chars, CEIL(RANDOM() * LENGTH(_chars))::INT, 1);
    END LOOP;
    -- Formata como XXXX-XXXX para legibilidade
    _code := SUBSTR(_code, 1, 4) || '-' || SUBSTR(_code, 5, 4);
    SELECT EXISTS(SELECT 1 FROM public.representantes WHERE codigo = _code) INTO _exists;
  END LOOP;
  RETURN _code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.gerar_codigo_representante() IS
  'Gera código único alfanumérico no formato XXXX-XXXX para identificação do representante';

-- Função: Gerar token único para lead (link de convite)
CREATE OR REPLACE FUNCTION public.gerar_token_lead()
  RETURNS VARCHAR(64) AS $$
DECLARE
  _token  TEXT;
  _exists BOOLEAN := TRUE;
BEGIN
  WHILE _exists LOOP
    -- 32 bytes = 64 hex chars
    SELECT encode(gen_random_bytes(32), 'hex') INTO _token;
    SELECT EXISTS(
      SELECT 1 FROM public.leads_representante WHERE token_atual = _token
    ) INTO _exists;
  END LOOP;
  RETURN _token;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.gerar_token_lead() IS
  'Gera token único de 64 chars para o link de convite de um lead';

-- Função: Registrar evento de auditoria de comissionamento
CREATE OR REPLACE FUNCTION public.registrar_auditoria_comissionamento(
  p_tabela        VARCHAR(50),
  p_registro_id   INTEGER,
  p_status_ant    VARCHAR(60),
  p_status_novo   VARCHAR(60),
  p_triggador     VARCHAR(30),
  p_motivo        TEXT         DEFAULT NULL,
  p_dados_extras  JSONB        DEFAULT NULL,
  p_cpf           CHAR(11)     DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.comissionamento_auditoria (
    tabela, registro_id, status_anterior, status_novo,
    triggador, motivo, dados_extras, criado_por_cpf
  ) VALUES (
    p_tabela, p_registro_id, p_status_ant, p_status_novo,
    p_triggador, p_motivo, p_dados_extras,
    COALESCE(p_cpf, NULLIF(current_setting('app.current_user_cpf', TRUE), ''))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Trigger: atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION public.set_atualizado_em_comissionamento()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_representantes_atualizado_em
  BEFORE UPDATE ON public.representantes
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em_comissionamento();

CREATE TRIGGER trg_leads_atualizado_em
  BEFORE UPDATE ON public.leads_representante
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em_comissionamento();

CREATE TRIGGER trg_vinculos_atualizado_em
  BEFORE UPDATE ON public.vinculos_comissao
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em_comissionamento();

CREATE TRIGGER trg_comissoes_atualizado_em
  BEFORE UPDATE ON public.comissoes_laudo
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em_comissionamento();

-- Trigger: Gerar código automático ao criar representante
CREATE OR REPLACE FUNCTION public.trg_gerar_codigo_representante()
  RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := public.gerar_codigo_representante();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_representante_codigo
  BEFORE INSERT ON public.representantes
  FOR EACH ROW EXECUTE FUNCTION public.trg_gerar_codigo_representante();

-- Trigger: Auditar transições de status nos representantes
CREATE OR REPLACE FUNCTION public.trg_auditar_representante_status()
  RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.registrar_auditoria_comissionamento(
      'representantes', NEW.id,
      OLD.status::TEXT, NEW.status::TEXT,
      'admin_action',
      'Mudança de status representante'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_representante_status_audit
  AFTER UPDATE ON public.representantes
  FOR EACH ROW EXECUTE FUNCTION public.trg_auditar_representante_status();

-- Trigger: Auditar transições de status nos vínculos
CREATE OR REPLACE FUNCTION public.trg_auditar_vinculo_status()
  RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.registrar_auditoria_comissionamento(
      'vinculos_comissao', NEW.id,
      OLD.status::TEXT, NEW.status::TEXT,
      'sistema',
      'Mudança de status vínculo'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vinculo_status_audit
  AFTER UPDATE ON public.vinculos_comissao
  FOR EACH ROW EXECUTE FUNCTION public.trg_auditar_vinculo_status();

-- Trigger: Auditar transições de status nas comissões
CREATE OR REPLACE FUNCTION public.trg_auditar_comissao_status()
  RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.registrar_auditoria_comissionamento(
      'comissoes_laudo', NEW.id,
      OLD.status::TEXT, NEW.status::TEXT,
      'sistema',
      'Mudança de status comissão'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comissao_status_audit
  AFTER UPDATE ON public.comissoes_laudo
  FOR EACH ROW EXECUTE FUNCTION public.trg_auditar_comissao_status();

-- Trigger: Ao emitir laudo, verificar e criar comissão + atualizar último laudo no vínculo
CREATE OR REPLACE FUNCTION public.trg_criar_comissao_ao_emitir_laudo()
  RETURNS TRIGGER AS $$
DECLARE
  _vinculo          RECORD;
  _rep              RECORD;
  _valor_laudo      DECIMAL(10,2);
  _percentual       DECIMAL(5,2) := 2.50;
  _valor_comissao   DECIMAL(10,2);
  _status_inicial   status_comissao;
  _mes_emissao      DATE;
  _mes_pagamento    DATE;
BEGIN
  -- Só acionar quando laudo é emitido (emitido_em preenchido pela primeira vez)
  IF NEW.emitido_em IS NULL OR OLD.emitido_em IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar ID da entidade (via lote → empresa ou entidade_id direto)
  SELECT vc.*
  INTO _vinculo
  FROM public.vinculos_comissao vc
  JOIN public.lotes_avaliacao la ON la.entidade_id = vc.entidade_id
                                 OR la.empresa_id IN (
                                   SELECT id FROM public.empresas_clientes
                                   WHERE clinica_id = vc.entidade_id
                                 )
  WHERE la.id = NEW.lote_id
    AND vc.status IN ('ativo', 'inativo')
    AND vc.data_expiracao > CURRENT_DATE
  ORDER BY vc.criado_em
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW; -- Sem vínculo ativo para este laudo
  END IF;

  -- Buscar representante
  SELECT * INTO _rep
  FROM public.representantes
  WHERE id = _vinculo.representante_id
    AND status NOT IN ('desativado', 'rejeitado');

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Calcular valor (usar campo valor do lote se disponível)
  SELECT COALESCE(valor_servico, 0) INTO _valor_laudo
  FROM public.lotes_avaliacao
  WHERE id = NEW.lote_id;

  IF _valor_laudo <= 0 THEN
    RETURN NEW; -- Sem valor definido, não gerar comissão
  END IF;

  _valor_comissao := ROUND(_valor_laudo * _percentual / 100, 2);

  -- Status inicial baseado no status do rep
  IF _rep.status = 'apto' THEN
    _status_inicial := 'aprovada';
  ELSE
    _status_inicial := 'retida';
  END IF;

  -- Cálculo do mês de emissão e pagamento
  _mes_emissao := DATE_TRUNC('month', NEW.emitido_em)::DATE;

  -- Mês de pagamento: mês seguinte ao de emissão
  _mes_pagamento := (_mes_emissao + INTERVAL '1 month')::DATE;

  -- Inserir comissão
  INSERT INTO public.comissoes_laudo (
    vinculo_id, representante_id, entidade_id, laudo_id,
    percentual_comissao, valor_laudo, valor_comissao,
    status, mes_emissao, mes_pagamento, data_emissao_laudo,
    data_aprovacao,
    auto_cancelamento_em
  ) VALUES (
    _vinculo.id, _rep.id, _vinculo.entidade_id, NEW.id,
    _percentual, _valor_laudo, _valor_comissao,
    _status_inicial, _mes_emissao, _mes_pagamento, NEW.emitido_em,
    CASE WHEN _status_inicial = 'aprovada' THEN NOW() ELSE NULL END,
    NULL  -- auto_cancelamento só se for congelada
  );

  -- Atualizar último laudo no vínculo
  UPDATE public.vinculos_comissao
  SET ultimo_laudo_em = NEW.emitido_em,
      status          = CASE WHEN status = 'inativo' THEN 'ativo' ELSE status END
  WHERE id = _vinculo.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_laudo_emitido_gerar_comissao
  AFTER UPDATE ON public.laudos
  FOR EACH ROW EXECUTE FUNCTION public.trg_criar_comissao_ao_emitir_laudo();

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.representantes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_representante      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vinculos_comissao        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes_laudo          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissionamento_auditoria ENABLE ROW LEVEL SECURITY;

-- Representantes: cada representante vê apenas seu próprio perfil
CREATE POLICY rep_sees_own
  ON public.representantes FOR SELECT
  USING (id = public.current_representante_id() OR public.current_user_perfil() = 'admin');

CREATE POLICY rep_update_own
  ON public.representantes FOR UPDATE
  USING (id = public.current_representante_id() OR public.current_user_perfil() = 'admin')
  WITH CHECK (id = public.current_representante_id() OR public.current_user_perfil() = 'admin');

CREATE POLICY rep_insert_public
  ON public.representantes FOR INSERT
  WITH CHECK (TRUE);  -- Cadastro público (onboarding)

-- Leads: representante vê apenas seus leads
CREATE POLICY leads_rep_own
  ON public.leads_representante FOR ALL
  USING (
    representante_id = public.current_representante_id()
    OR public.current_user_perfil() = 'admin'
  )
  WITH CHECK (
    representante_id = public.current_representante_id()
    OR public.current_user_perfil() = 'admin'
  );

-- Vínculos: representante vê apenas seus vínculos
CREATE POLICY vinculos_rep_own
  ON public.vinculos_comissao FOR ALL
  USING (
    representante_id = public.current_representante_id()
    OR public.current_user_perfil() = 'admin'
  )
  WITH CHECK (
    representante_id = public.current_representante_id()
    OR public.current_user_perfil() = 'admin'
  );

-- Comissões: representante vê apenas suas comissões
CREATE POLICY comissoes_rep_own
  ON public.comissoes_laudo FOR ALL
  USING (
    representante_id = public.current_representante_id()
    OR public.current_user_perfil() = 'admin'
  )
  WITH CHECK (
    representante_id = public.current_representante_id()
    OR public.current_user_perfil() = 'admin'
  );

-- Auditoria: somente Admin lê
CREATE POLICY auditoria_admin_only
  ON public.comissionamento_auditoria FOR SELECT
  USING (public.current_user_perfil() = 'admin');

-- ============================================================================
-- 7. JOB FUNCTIONS (executadas pelos cron jobs da aplicação)
-- ============================================================================

-- Job 1: Expirar leads vencidos (roda diariamente)
CREATE OR REPLACE FUNCTION public.job_expirar_leads_vencidos()
  RETURNS INTEGER AS $$
DECLARE
  _count INTEGER;
BEGIN
  UPDATE public.leads_representante
  SET    status = 'expirado'
  WHERE  status = 'pendente'
    AND  data_expiracao <= NOW();

  GET DIAGNOSTICS _count = ROW_COUNT;

  IF _count > 0 THEN
    INSERT INTO public.comissionamento_auditoria
      (tabela, registro_id, status_anterior, status_novo, triggador, motivo)
    SELECT 'leads_representante', id, 'pendente', 'expirado', 'job', '90 dias sem conversão'
    FROM   public.leads_representante
    WHERE  status = 'expirado'
      AND  atualizado_em >= NOW() - INTERVAL '5 minutes';
  END IF;

  RETURN _count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.job_expirar_leads_vencidos() IS
  'Expira leads com data_expiracao <= NOW(). Executado pelo cron diário.';

-- Job 2: Marcar vínculos inativos (≥ 90 dias sem laudo, roda diariamente)
CREATE OR REPLACE FUNCTION public.job_marcar_vinculos_inativos()
  RETURNS INTEGER AS $$
DECLARE
  _count INTEGER;
BEGIN
  UPDATE public.vinculos_comissao
  SET    status = 'inativo'
  WHERE  status = 'ativo'
    AND  (ultimo_laudo_em IS NULL OR ultimo_laudo_em <= NOW() - INTERVAL '90 days')
    AND  data_expiracao > CURRENT_DATE;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.job_marcar_vinculos_inativos() IS
  'Marca como inativo vínculos sem laudo por 90+ dias. Executado pelo cron diário.';

-- Job 3: Encerrar vínculos expirados (roda diariamente, meia-noite)
CREATE OR REPLACE FUNCTION public.job_encerrar_vinculos_expirados()
  RETURNS INTEGER AS $$
DECLARE
  _count INTEGER;
BEGIN
  UPDATE public.vinculos_comissao
  SET    status        = 'encerrado',
         encerrado_em  = NOW(),
         encerrado_motivo = 'Vínculo de 1 ano expirou sem renovação'
  WHERE  status IN ('ativo', 'inativo', 'suspenso')
    AND  data_expiracao <= CURRENT_DATE;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.job_encerrar_vinculos_expirados() IS
  'Encerra vínculos com data_expiracao <= CURRENT_DATE. Executado pelo cron diário à meia-noite.';

-- Job 4: Auto-cancelar comissões congeladas após 30 dias (roda diariamente)
CREATE OR REPLACE FUNCTION public.job_auto_cancelar_comissoes_congeladas()
  RETURNS INTEGER AS $$
DECLARE
  _count INTEGER;
BEGIN
  UPDATE public.comissoes_laudo
  SET    status = 'cancelada',
         atualizado_em = NOW()
  WHERE  status = 'congelada_aguardando_admin'
    AND  auto_cancelamento_em IS NOT NULL
    AND  auto_cancelamento_em <= NOW();

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.job_auto_cancelar_comissoes_congeladas() IS
  'Cancel automático de comissões congeladas sem decisão Admin em 30 dias. Executado pelo cron diário.';

-- Job 5: Ao representante virar 'apto', liberar todas comissões 'retida' → 'aprovada'
CREATE OR REPLACE FUNCTION public.liberar_comissoes_retidas(p_representante_id INTEGER)
  RETURNS INTEGER AS $$
DECLARE
  _count INTEGER;
BEGIN
  UPDATE public.comissoes_laudo
  SET    status           = 'aprovada',
         data_aprovacao   = NOW()
  WHERE  representante_id = p_representante_id
    AND  status = 'retida';

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.liberar_comissoes_retidas(INTEGER) IS
  'Chamada quando representante vira apto. Transita todas comissões retidas para aprovada.';

-- ============================================================================
-- 8. VERIFICAÇÃO DE CNPJ NA LISTA DE LEADS (para cadastro de clientes)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verificar_lead_ativo_por_cnpj(p_cnpj CHAR(14))
  RETURNS TABLE (
    lead_id          INTEGER,
    representante_id INTEGER,
    data_expiracao   TIMESTAMPTZ
  ) AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.representante_id, l.data_expiracao
  FROM   public.leads_representante l
  WHERE  l.cnpj    = p_cnpj
    AND  l.status  = 'pendente'
    AND  l.data_expiracao > NOW()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.verificar_lead_ativo_por_cnpj(CHAR) IS
  'Verifica se há lead ativo para um CNPJ. Retorna representante_id se existir. NUNCA expõe o nome do representante — apenas o ID interno.';

-- ============================================================================
-- COMMIT
-- ============================================================================

COMMIT;
