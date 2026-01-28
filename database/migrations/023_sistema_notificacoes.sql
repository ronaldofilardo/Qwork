-- Migration 023: Sistema de Notificações
-- Suporte a notificações em tempo real para admin e gestores

-- Enum para tipos de notificação
CREATE TYPE tipo_notificacao AS ENUM (
  'pre_cadastro_criado',      -- Novo pré-cadastro aguardando definição de valor
  'valor_definido',            -- Admin definiu valor, contrato gerado
  'contrato_aceito',           -- Gestor aceitou contrato
  'pagamento_confirmado',      -- Sistema confirmou pagamento
  'contratacao_ativa',         -- Contratação finalizada e ativa
  'rejeicao_admin',            -- Admin rejeitou pré-cadastro
  'cancelamento_gestor',       -- Gestor cancelou contratação
  'sla_excedido',              -- SLA de 48h excedido sem resposta
  'alerta_geral'               -- Notificações gerais do sistema
);

-- Enum para prioridades
CREATE TYPE prioridade_notificacao AS ENUM (
  'baixa',
  'media',
  'alta',
  'critica'
);

-- Tabela principal de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  
  -- Identificação
  tipo tipo_notificacao NOT NULL,
  prioridade prioridade_notificacao DEFAULT 'media',
  
  -- Destinatário
  destinatario_id INTEGER NOT NULL,
  destinatario_tipo TEXT NOT NULL CHECK (destinatario_tipo IN ('admin', 'gestor_entidade', 'funcionario')),
  
  -- Conteúdo
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  dados_contexto JSONB, -- Dados adicionais (contratacao_id, valores, etc.)
  
  -- Links/Ações
  link_acao TEXT, -- URL para ação relacionada
  botao_texto TEXT, -- Texto do botão de ação
  
  -- Estado
  lida BOOLEAN DEFAULT FALSE,
  data_leitura TIMESTAMP,
  arquivada BOOLEAN DEFAULT FALSE,
  
  -- Referências
  contratacao_personalizada_id INTEGER REFERENCES contratacao_personalizada(id) ON DELETE CASCADE,
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT NOW(),
  expira_em TIMESTAMP, -- Notificações podem expirar após X dias
  
  -- Índices
  CONSTRAINT notificacao_destinatario_valido CHECK (destinatario_id > 0)
);

-- Índices para performance
CREATE INDEX idx_notificacoes_destinatario ON notificacoes(destinatario_id, destinatario_tipo);
CREATE INDEX idx_notificacoes_nao_lidas ON notificacoes(destinatario_id) WHERE lida = FALSE;
CREATE INDEX idx_notificacoes_tipo ON notificacoes(tipo);
CREATE INDEX idx_notificacoes_contratacao ON notificacoes(contratacao_personalizada_id);
CREATE INDEX idx_notificacoes_criado_em ON notificacoes(criado_em DESC);

-- Trigger para notificação automática: novo pré-cadastro
CREATE OR REPLACE FUNCTION notificar_pre_cadastro_criado()
RETURNS TRIGGER AS $$
DECLARE
  v_contratante_nome TEXT;
BEGIN
  -- Buscar nome do contratante
  SELECT nome_fantasia INTO v_contratante_nome
  FROM clinicas
  WHERE id = NEW.contratante_id;

  -- Notificar todos os admins
  INSERT INTO notificacoes (
    tipo, prioridade, destinatario_id, destinatario_tipo,
    titulo, mensagem, dados_contexto, link_acao, botao_texto,
    contratacao_personalizada_id
  )
  SELECT 
    'pre_cadastro_criado',
    'alta',
    u.id,
    'admin',
    'Novo Pré-Cadastro: ' || v_contratante_nome,
    'Um novo pré-cadastro de plano personalizado foi criado e aguarda definição de valor. Funcionários estimados: ' || NEW.numero_funcionarios_estimado || '.',
    jsonb_build_object(
      'contratacao_id', NEW.id,
      'contratante_nome', v_contratante_nome,
      'numero_funcionarios', NEW.numero_funcionarios_estimado,
      'justificativa', NEW.justificativa_contratante
    ),
    '/admin/contratacao/pendentes',
    'Definir Valor',
    NEW.id
  FROM usuarios u
  WHERE u.role = 'admin' AND u.ativo = TRUE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_pre_cadastro
  AFTER INSERT ON contratacao_personalizada
  FOR EACH ROW
  WHEN (NEW.status = 'aguardando_valor_admin')
  EXECUTE FUNCTION notificar_pre_cadastro_criado();

-- Trigger para notificação: valor definido → contrato gerado
CREATE OR REPLACE FUNCTION notificar_valor_definido()
RETURNS TRIGGER AS $$
DECLARE
  v_contratante_nome TEXT;
  v_gestor_id INTEGER;
BEGIN
  -- Buscar dados do contratante
  SELECT c.nome_fantasia, c.id INTO v_contratante_nome, v_gestor_id
  FROM clinicas c
  WHERE c.id = NEW.contratante_id;

  -- Notificar gestor do contratante
  INSERT INTO notificacoes (
    tipo, prioridade, destinatario_id, destinatario_tipo,
    titulo, mensagem, dados_contexto, link_acao, botao_texto,
    contratacao_personalizada_id
  )
  VALUES (
    'valor_definido',
    'media',
    v_gestor_id,
    'gestor_entidade',
    'Valor Definido para Plano Personalizado',
    'O valor do seu plano personalizado foi definido. Valor por funcionário: R$ ' || 
      TO_CHAR(NEW.valor_por_funcionario, 'FM999G999G990D00') || 
      '. Total estimado: R$ ' || TO_CHAR(NEW.valor_total_estimado, 'FM999G999G990D00') || '.',
    jsonb_build_object(
      'contratacao_id', NEW.id,
      'valor_por_funcionario', NEW.valor_por_funcionario,
      'valor_total_estimado', NEW.valor_total_estimado,
      'observacoes_admin', NEW.observacoes_admin
    ),
    '/entidade/contratacao/' || NEW.id,
    'Ver Contrato',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_valor_definido
  AFTER UPDATE ON contratacao_personalizada
  FOR EACH ROW
  WHEN (OLD.status = 'aguardando_valor_admin' AND NEW.status = 'valor_definido')
  EXECUTE FUNCTION notificar_valor_definido();

-- Trigger para notificação: SLA excedido (48h)
CREATE OR REPLACE FUNCTION notificar_sla_excedido()
RETURNS TRIGGER AS $$
DECLARE
  v_contratante_nome TEXT;
  v_horas_decorridas NUMERIC;
BEGIN
  -- Calcular horas desde criação
  v_horas_decorridas := EXTRACT(EPOCH FROM (NOW() - NEW.criado_em)) / 3600;

  IF v_horas_decorridas > 48 AND NEW.status = 'aguardando_valor_admin' THEN
    -- Buscar nome do contratante
    SELECT nome_fantasia INTO v_contratante_nome
    FROM clinicas
    WHERE id = NEW.contratante_id;

    -- Notificar admins sobre SLA excedido
    INSERT INTO notificacoes (
      tipo, prioridade, destinatario_id, destinatario_tipo,
      titulo, mensagem, dados_contexto, link_acao, botao_texto,
      contratacao_personalizada_id
    )
    SELECT 
      'sla_excedido',
      'critica',
      u.id,
      'admin',
      '🚨 SLA Excedido: ' || v_contratante_nome,
      'Pré-cadastro aguardando definição de valor há mais de 48 horas. Ação urgente necessária.',
      jsonb_build_object(
        'contratacao_id', NEW.id,
        'horas_decorridas', ROUND(v_horas_decorridas, 1),
        'contratante_nome', v_contratante_nome
      ),
      '/admin/contratacao/pendentes',
      'Definir Valor Agora',
      NEW.id
    FROM usuarios u
    WHERE u.role = 'admin' AND u.ativo = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- View para dashboard de notificações
CREATE OR REPLACE VIEW vw_notificacoes_dashboard AS
SELECT 
  n.id,
  n.tipo,
  n.prioridade,
  n.destinatario_id,
  n.destinatario_tipo,
  n.titulo,
  n.mensagem,
  n.lida,
  n.arquivada,
  n.criado_em,
  n.link_acao,
  n.botao_texto,
  n.dados_contexto,
  cp.status AS contratacao_status,
  c.nome_fantasia AS contratante_nome,
  -- Flag se expirou
  CASE 
    WHEN n.expira_em IS NOT NULL AND n.expira_em < NOW() THEN TRUE
    ELSE FALSE
  END AS expirada
FROM notificacoes n
LEFT JOIN contratacao_personalizada cp ON n.contratacao_personalizada_id = cp.id
LEFT JOIN clinicas c ON cp.contratante_id = c.id
WHERE n.arquivada = FALSE
ORDER BY 
  CASE n.prioridade
    WHEN 'critica' THEN 1
    WHEN 'alta' THEN 2
    WHEN 'media' THEN 3
    WHEN 'baixa' THEN 4
  END,
  n.criado_em DESC;

-- View para contagem de não lidas por usuário
CREATE OR REPLACE VIEW vw_notificacoes_nao_lidas AS
SELECT 
  destinatario_id,
  destinatario_tipo,
  COUNT(*) AS total_nao_lidas,
  COUNT(*) FILTER (WHERE prioridade = 'critica') AS criticas,
  COUNT(*) FILTER (WHERE prioridade = 'alta') AS altas,
  MAX(criado_em) AS ultima_notificacao
FROM notificacoes
WHERE lida = FALSE AND arquivada = FALSE
GROUP BY destinatario_id, destinatario_tipo;

-- Função para marcar notificações como lidas
CREATE OR REPLACE FUNCTION marcar_notificacoes_lidas(
  p_notificacao_ids INTEGER[],
  p_usuario_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notificacoes
  SET lida = TRUE,
      data_leitura = NOW()
  WHERE id = ANY(p_notificacao_ids)
    AND destinatario_id = p_usuario_id
    AND lida = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Função para arquivar notificações antigas (limpeza automática)
CREATE OR REPLACE FUNCTION arquivar_notificacoes_antigas()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notificacoes
  SET arquivada = TRUE
  WHERE lida = TRUE
    AND criado_em < NOW() - INTERVAL '30 days'
    AND arquivada = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies para notificações
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Admin vê todas as notificações
CREATE POLICY notificacoes_admin_full_access ON notificacoes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.id = destinatario_id 
        AND usuarios.role = 'admin'
    )
  );

-- Gestor vê apenas suas notificações
CREATE POLICY notificacoes_gestor_own ON notificacoes
  FOR SELECT
  TO authenticated
  USING (
    destinatario_tipo = 'gestor_entidade'
    AND destinatario_id = current_setting('app.current_user_id', TRUE)::INTEGER
  );

-- Gestor pode marcar suas notificações como lidas
CREATE POLICY notificacoes_gestor_update ON notificacoes
  FOR UPDATE
  TO authenticated
  USING (
    destinatario_tipo = 'gestor_entidade'
    AND destinatario_id = current_setting('app.current_user_id', TRUE)::INTEGER
  )
  WITH CHECK (
    destinatario_tipo = 'gestor_entidade'
    AND destinatario_id = current_setting('app.current_user_id', TRUE)::INTEGER
  );

COMMENT ON TABLE notificacoes IS 'Sistema de notificações em tempo real para admin e gestores';
COMMENT ON COLUMN notificacoes.dados_contexto IS 'JSONB com dados adicionais específicos do tipo de notificação';
COMMENT ON COLUMN notificacoes.expira_em IS 'Data de expiração da notificação (limpeza automática)';
