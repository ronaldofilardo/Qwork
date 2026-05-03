-- Migration 024: Prioridade Baixa - Historico de Alteracoes e Campos Customizaveis
-- Implementa auditoria de alteracoes de valores e campos configuráveis por clínica

-- =============================================================================
-- PARTE 1: HISTÓRICO DE ALTERAÇÕES DE VALORES
-- =============================================================================

-- Tabela para registrar todas as alterações de valores de contratação
CREATE TABLE IF NOT EXISTS historico_alteracoes_valores (
  id SERIAL PRIMARY KEY,
  
  -- Referência
  contratacao_personalizada_id INTEGER NOT NULL REFERENCES contratacao_personalizada(id) ON DELETE CASCADE,
  
  -- Valores antigos
  valor_anterior_por_funcionario NUMERIC(10, 2),
  valor_anterior_total NUMERIC(10, 2),
  
  -- Valores novos
  valor_novo_por_funcionario NUMERIC(10, 2) NOT NULL,
  valor_novo_total NUMERIC(10, 2) NOT NULL,
  
  -- Justificativa da alteração
  motivo_alteracao TEXT NOT NULL CHECK (length(motivo_alteracao) >= 20),
  tipo_alteracao TEXT NOT NULL CHECK (tipo_alteracao IN ('ajuste_manual', 'reajuste_anual', 'correcao_erro', 'acordo_comercial', 'outro')),
  
  -- Auditoria
  alterado_por_cpf TEXT NOT NULL,
  alterado_por_nome TEXT,
  alterado_por_role TEXT NOT NULL CHECK (alterado_por_role IN ('admin', 'gestor')),
  data_alteracao TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  ip_origem TEXT,
  user_agent TEXT,
  dados_adicionais JSONB
);

-- Índices
CREATE INDEX idx_historico_alteracoes_contratacao ON historico_alteracoes_valores(contratacao_personalizada_id);
CREATE INDEX idx_historico_alteracoes_data ON historico_alteracoes_valores(data_alteracao DESC);
CREATE INDEX idx_historico_alteracoes_usuario ON historico_alteracoes_valores(alterado_por_cpf);

-- Trigger para registrar alterações automáticas de valores
CREATE OR REPLACE FUNCTION registrar_alteracao_valor()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas registrar se houve mudança nos valores
  IF (OLD.valor_por_funcionario IS DISTINCT FROM NEW.valor_por_funcionario) 
     OR (OLD.valor_total_estimado IS DISTINCT FROM NEW.valor_total_estimado) THEN
    
    INSERT INTO historico_alteracoes_valores (
      contratacao_personalizada_id,
      valor_anterior_por_funcionario,
      valor_anterior_total,
      valor_novo_por_funcionario,
      valor_novo_total,
      motivo_alteracao,
      tipo_alteracao,
      alterado_por_cpf,
      alterado_por_nome,
      alterado_por_role
    ) VALUES (
      NEW.id,
      OLD.valor_por_funcionario,
      OLD.valor_total_estimado,
      NEW.valor_por_funcionario,
      NEW.valor_total_estimado,
      COALESCE(NEW.observacoes_admin, 'Alteracao automatica do sistema'),
      'ajuste_manual',
      COALESCE(NULLIF(current_setting('app.current_user_cpf', TRUE), ''), 'SISTEMA'),
      NULLIF(current_setting('app.current_user_nome', TRUE), ''),
      COALESCE(NULLIF(current_setting('app.current_user_perfil', TRUE), ''), 'admin')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_registrar_alteracao_valor ON contratacao_personalizada;
CREATE TRIGGER trigger_registrar_alteracao_valor
  AFTER UPDATE ON contratacao_personalizada
  FOR EACH ROW
  WHEN (OLD.valor_por_funcionario IS DISTINCT FROM NEW.valor_por_funcionario 
        OR OLD.valor_total_estimado IS DISTINCT FROM NEW.valor_total_estimado)
  EXECUTE FUNCTION registrar_alteracao_valor();

-- View para relatório de alterações
CREATE OR REPLACE VIEW vw_historico_alteracoes_valores_completo AS
SELECT 
  h.id,
  h.contratacao_personalizada_id,
  c.nome_fantasia AS contratante_nome,
  h.valor_anterior_por_funcionario,
  h.valor_anterior_total,
  h.valor_novo_por_funcionario,
  h.valor_novo_total,
  (h.valor_novo_total - h.valor_anterior_total) AS diferenca_valor,
  CASE 
    WHEN h.valor_novo_total > h.valor_anterior_total THEN 'aumento'
    WHEN h.valor_novo_total < h.valor_anterior_total THEN 'reducao'
    ELSE 'sem_mudanca'
  END AS direcao_mudanca,
  ROUND(((h.valor_novo_total - h.valor_anterior_total) / NULLIF(h.valor_anterior_total, 0)) * 100, 2) AS percentual_mudanca,
  h.motivo_alteracao,
  h.tipo_alteracao,
  h.alterado_por_cpf,
  h.alterado_por_nome,
  h.alterado_por_role,
  h.data_alteracao,
  EXTRACT(EPOCH FROM (NOW() - h.data_alteracao)) / 86400 AS dias_desde_alteracao
FROM historico_alteracoes_valores h
LEFT JOIN contratacao_personalizada cp ON h.contratacao_personalizada_id = cp.id
LEFT JOIN clinicas c ON cp.contratante_id = c.id
ORDER BY h.data_alteracao DESC;

-- =============================================================================
-- PARTE 2: CAMPOS CUSTOMIZÁVEIS POR CLÍNICA
-- =============================================================================

-- Tabela para armazenar configurações personalizadas por clínica
CREATE TABLE IF NOT EXISTS clinica_configuracoes (
  id SERIAL PRIMARY KEY,
  
  -- Referência
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  
  -- Configurações de campos customizáveis
  campos_customizados JSONB DEFAULT '{}'::JSONB,
  
  -- Exemplos de campos que podem ser customizados:
  -- {
  --   "campos_extras_funcionario": ["matricula_interna", "centro_custo", "turno"],
  --   "campos_extras_avaliacao": ["projeto_associado", "area_atuacao"],
  --   "labels_customizados": {
  --     "funcionario": "Colaborador",
  --     "avaliacao": "Pesquisa"
  --   },
  --   "validacoes_customizadas": {
  --     "matricula_interna": {"obrigatorio": true, "formato": "^[A-Z]{2}\\d{4}$"}
  --   }
  -- }
  
  -- Configurações de branding
  logo_url TEXT,
  cor_primaria TEXT CHECK (cor_primaria ~ '^#[0-9A-Fa-f]{6}$'),
  cor_secundaria TEXT CHECK (cor_secundaria ~ '^#[0-9A-Fa-f]{6}$'),
  
  -- Configurações de relatórios
  template_relatorio_id INTEGER,
  incluir_logo_relatorios BOOLEAN DEFAULT TRUE,
  formato_data_preferencial TEXT DEFAULT 'dd/MM/yyyy' CHECK (formato_data_preferencial IN ('dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd')),
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  atualizado_por_cpf TEXT,
  
  -- Constraint: uma configuração por clínica
  CONSTRAINT unique_clinica_config UNIQUE (clinica_id)
);

-- Índice
CREATE INDEX idx_clinica_configuracoes_clinica ON clinica_configuracoes(clinica_id);

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION atualizar_timestamp_configuracoes()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  NEW.atualizado_por_cpf = COALESCE(NULLIF(current_setting('app.current_user_cpf', TRUE), ''), NEW.atualizado_por_cpf);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_timestamp_configuracoes
  BEFORE UPDATE ON clinica_configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp_configuracoes();

-- Função auxiliar para buscar configuração com fallback
CREATE OR REPLACE FUNCTION obter_config_clinica(p_clinica_id INTEGER, p_chave TEXT)
RETURNS JSONB AS $$
DECLARE
  v_valor JSONB;
BEGIN
  SELECT campos_customizados->p_chave INTO v_valor
  FROM clinica_configuracoes
  WHERE clinica_id = p_clinica_id;
  
  RETURN COALESCE(v_valor, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PARTE 3: TEMPLATES DE CONTRATO EDITÁVEIS
-- =============================================================================

-- Tabela para armazenar templates de contratos
CREATE TABLE IF NOT EXISTS templates_contrato (
  id SERIAL PRIMARY KEY,
  
  -- Identificação
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  tipo_template TEXT NOT NULL CHECK (tipo_template IN ('padrao')),
  
  -- Conteúdo do template (HTML ou Markdown com placeholders)
  conteudo TEXT NOT NULL,
  
  -- Placeholders disponíveis:
  -- {{contratante_nome}}, {{contratante_cnpj}}, {{valor_total}}, 
  -- {{numero_funcionarios}}, {{data_contrato}}, {{prazo_validade}}, etc.
  
  -- Configurações
  ativo BOOLEAN DEFAULT TRUE,
  padrao BOOLEAN DEFAULT FALSE, -- Template padrão para o tipo
  versao INTEGER DEFAULT 1,
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT NOW(),
  criado_por_cpf TEXT,
  atualizado_em TIMESTAMP DEFAULT NOW(),
  atualizado_por_cpf TEXT,
  
  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Índices
CREATE INDEX idx_templates_contrato_tipo ON templates_contrato(tipo_template);
CREATE INDEX idx_templates_contrato_ativo ON templates_contrato(ativo) WHERE ativo = TRUE;
CREATE INDEX idx_templates_contrato_padrao ON templates_contrato(tipo_template, padrao) WHERE padrao = TRUE;

-- =============================================================================
-- PARTE 4: MULTI-IDIOMA PARA NOTIFICAÇÕES
-- =============================================================================

-- Enum para idiomas suportados
DO $$ BEGIN
    CREATE TYPE idioma_suportado AS ENUM ('pt_BR', 'en_US', 'es_ES');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela para traduções de notificações
CREATE TABLE IF NOT EXISTS notificacoes_traducoes (
  id SERIAL PRIMARY KEY,
  
  -- Chave de tradução (ex: 'pre_cadastro_criado_titulo')
  chave_traducao TEXT NOT NULL,
  idioma idioma_suportado NOT NULL,
  
  -- Conteúdo traduzido
  conteudo TEXT NOT NULL,
  
  -- Categoria
  categoria TEXT NOT NULL CHECK (categoria IN ('titulo', 'mensagem', 'botao', 'geral')),
  
  -- Metadata
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  
  -- Constraint: uma tradução por chave+idioma
  CONSTRAINT unique_traducao UNIQUE (chave_traducao, idioma)
);

-- Índice
CREATE INDEX idx_notificacoes_traducoes_chave ON notificacoes_traducoes(chave_traducao, idioma);

-- Inserir traduções padrão
INSERT INTO notificacoes_traducoes (chave_traducao, idioma, conteudo, categoria) VALUES
-- Português
('pre_cadastro_criado_titulo', 'pt_BR', 'Novo Pre-Cadastro: {{contratante_nome}}', 'titulo'),
('pre_cadastro_criado_mensagem', 'pt_BR', 'Um novo pre-cadastro foi criado. Funcionarios estimados: {{numero_funcionarios}}.', 'mensagem'),
('pre_cadastro_criado_botao', 'pt_BR', 'Definir Valor', 'botao'),

-- Inglês
('pre_cadastro_criado_titulo', 'en_US', 'New Pre-Registration: {{contratante_nome}}', 'titulo'),
('pre_cadastro_criado_mensagem', 'en_US', 'A new pre-registration has been created. Estimated employees: {{numero_funcionarios}}.', 'mensagem'),
('pre_cadastro_criado_botao', 'en_US', 'Set Value', 'botao'),

-- Espanhol
('pre_cadastro_criado_titulo', 'es_ES', 'Nuevo Pre-Registro: {{contratante_nome}}', 'titulo'),
('pre_cadastro_criado_mensagem', 'es_ES', 'Se ha creado un nuevo pre-registro. Empleados estimados: {{numero_funcionarios}}.', 'mensagem'),
('pre_cadastro_criado_botao', 'es_ES', 'Definir Valor', 'botao')
ON CONFLICT (chave_traducao, idioma) DO NOTHING;

-- Função para obter tradução
CREATE OR REPLACE FUNCTION obter_traducao(p_chave TEXT, p_idioma idioma_suportado DEFAULT 'pt_BR')
RETURNS TEXT AS $$
DECLARE
  v_traducao TEXT;
BEGIN
  SELECT conteudo INTO v_traducao
  FROM notificacoes_traducoes
  WHERE chave_traducao = p_chave AND idioma = p_idioma;
  
  -- Fallback para português se não encontrar tradução
  IF v_traducao IS NULL THEN
    SELECT conteudo INTO v_traducao
    FROM notificacoes_traducoes
    WHERE chave_traducao = p_chave AND idioma = 'pt_BR';
  END IF;
  
  RETURN COALESCE(v_traducao, p_chave);
END;
$$ LANGUAGE plpgsql;

-- Adicionar coluna de idioma preferencial nas clínicas
ALTER TABLE clinicas ADD COLUMN IF NOT EXISTS idioma_preferencial idioma_suportado DEFAULT 'pt_BR';

COMMENT ON TABLE historico_alteracoes_valores IS 'Auditoria de todas as alteracoes de valores em contratacoes personalizadas';
COMMENT ON TABLE clinica_configuracoes IS 'Configuracoes e campos customizaveis por clinica';
COMMENT ON TABLE templates_contrato IS 'Templates editaveis para geracao de contratos';
COMMENT ON TABLE notificacoes_traducoes IS 'Traducoes de notificacoes para multi-idioma';
