-- Migration 023: Sistema de Notificacoes (Corrigido)
-- Suporte a notificacoes em tempo real para admin e gestores

-- Enum para tipos de notificacao
DO $$ BEGIN
    CREATE TYPE tipo_notificacao AS ENUM (
      'pre_cadastro_criado',
      'valor_definido',
      'contrato_aceito',
      'pagamento_confirmado',
      'contratacao_ativa',
      'rejeicao_admin',
      'cancelamento_gestor',
      'sla_excedido',
      'alerta_geral'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para prioridades
DO $$ BEGIN
    CREATE TYPE prioridade_notificacao AS ENUM (
      'baixa',
      'media',
      'alta',
      'critica'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela principal de notificacoes
CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  
  -- Identificacao
  tipo tipo_notificacao NOT NULL,
  prioridade prioridade_notificacao DEFAULT 'media',
  
  -- Destinatario
  destinatario_cpf TEXT NOT NULL,
  destinatario_tipo TEXT NOT NULL CHECK (destinatario_tipo IN ('admin', 'gestor', 'funcionario')),
  
  -- Conteudo
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  dados_contexto JSONB,
  
  -- Links/Acoes
  link_acao TEXT,
  botao_texto TEXT,
  
  -- Estado
  lida BOOLEAN DEFAULT FALSE,
  data_leitura TIMESTAMP,
  arquivada BOOLEAN DEFAULT FALSE,
  
  -- Referencias
  contratacao_personalizada_id INTEGER REFERENCES contratacao_personalizada(id) ON DELETE CASCADE,
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT NOW(),
  expira_em TIMESTAMP,
  
  -- Constraint
  CONSTRAINT notificacao_destinatario_valido CHECK (length(destinatario_cpf) > 0)
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_destinatario ON notificacoes(destinatario_cpf, destinatario_tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_nao_lidas ON notificacoes(destinatario_cpf) WHERE lida = FALSE;
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_contratacao ON notificacoes(contratacao_personalizada_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_criado_em ON notificacoes(criado_em DESC);

-- Trigger para notificacao automatica: novo pre-cadastro
CREATE OR REPLACE FUNCTION notificar_pre_cadastro_criado()
RETURNS TRIGGER AS $$
DECLARE
  v_contratante_nome TEXT;
  v_admin_record RECORD;
BEGIN
  -- Buscar nome do contratante
  SELECT nome_fantasia INTO v_contratante_nome
  FROM clinicas
  WHERE id = NEW.contratante_id;

  -- Notificar todos os admins
  FOR v_admin_record IN 
    SELECT cpf FROM usuarios WHERE role = 'admin' AND ativo = TRUE
  LOOP
    INSERT INTO notificacoes (
      tipo, prioridade, destinatario_cpf, destinatario_tipo,
      titulo, mensagem, dados_contexto, link_acao, botao_texto,
      contratacao_personalizada_id
    ) VALUES (
      'pre_cadastro_criado',
      'alta',
      v_admin_record.cpf,
      'admin',
      'Novo Pre-Cadastro: ' || v_contratante_nome,
      'Um novo pre-cadastro de plano personalizado foi criado e aguarda definicao de valor. Funcionarios estimados: ' || NEW.numero_funcionarios_estimado || '.',
      jsonb_build_object(
        'contratacao_id', NEW.id,
        'contratante_nome', v_contratante_nome,
        'numero_funcionarios', NEW.numero_funcionarios_estimado,
        'justificativa', NEW.justificativa_contratante
      ),
      '/admin/contratacao/pendentes',
      'Definir Valor',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notificar_pre_cadastro ON contratacao_personalizada;
CREATE TRIGGER trigger_notificar_pre_cadastro
  AFTER INSERT ON contratacao_personalizada
  FOR EACH ROW
  WHEN (NEW.status = 'aguardando_valor_admin')
  EXECUTE FUNCTION notificar_pre_cadastro_criado();

-- Trigger para notificacao: valor definido
CREATE OR REPLACE FUNCTION notificar_valor_definido()
RETURNS TRIGGER AS $$
DECLARE
  v_contratante_nome TEXT;
  v_gestor_cpf TEXT;
BEGIN
  -- Buscar dados do contratante
  SELECT c.nome_fantasia, c.responsavel_cpf INTO v_contratante_nome, v_gestor_cpf
  FROM clinicas c
  WHERE c.id = NEW.contratante_id;

  -- Notificar gestor do contratante
  INSERT INTO notificacoes (
    tipo, prioridade, destinatario_cpf, destinatario_tipo,
    titulo, mensagem, dados_contexto, link_acao, botao_texto,
    contratacao_personalizada_id
  ) VALUES (
    'valor_definido',
    'media',
    v_gestor_cpf,
    'gestor',
    'Valor Definido para Plano Personalizado',
    'O valor do seu plano personalizado foi definido. Valor por funcionario: R$ ' || 
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

DROP TRIGGER IF EXISTS trigger_notificar_valor_definido ON contratacao_personalizada;
CREATE TRIGGER trigger_notificar_valor_definido
  AFTER UPDATE ON contratacao_personalizada
  FOR EACH ROW
  WHEN (OLD.status = 'aguardando_valor_admin' AND NEW.status = 'valor_definido')
  EXECUTE FUNCTION notificar_valor_definido();

-- View para dashboard de notificacoes
CREATE OR REPLACE VIEW vw_notificacoes_dashboard AS
SELECT 
  n.id,
  n.tipo,
  n.prioridade,
  n.destinatario_cpf,
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

-- View para contagem de nao lidas por usuario
CREATE OR REPLACE VIEW vw_notificacoes_nao_lidas AS
SELECT 
  destinatario_cpf,
  destinatario_tipo,
  COUNT(*) AS total_nao_lidas,
  COUNT(*) FILTER (WHERE prioridade = 'critica') AS criticas,
  COUNT(*) FILTER (WHERE prioridade = 'alta') AS altas,
  MAX(criado_em) AS ultima_notificacao
FROM notificacoes
WHERE lida = FALSE AND arquivada = FALSE
GROUP BY destinatario_cpf, destinatario_tipo;

-- Funcao para marcar notificacoes como lidas
CREATE OR REPLACE FUNCTION marcar_notificacoes_lidas(
  p_notificacao_ids INTEGER[],
  p_usuario_cpf TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notificacoes
  SET lida = TRUE,
      data_leitura = NOW()
  WHERE id = ANY(p_notificacao_ids)
    AND destinatario_cpf = p_usuario_cpf
    AND lida = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Funcao para arquivar notificacoes antigas (limpeza automatica)
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

-- RLS Policies para notificacoes
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Admin NÃO acessa notificações operacionais (apenas administrativo)
-- Restringir acesso operacional apenas para gestores
-- Gestor vê apenas suas notificações
CREATE POLICY notificacoes_gestor_own ON notificacoes
  FOR SELECT
  USING (
    destinatario_tipo = 'gestor'
    AND destinatario_cpf = NULLIF(current_setting('app.current_user_cpf', TRUE), '')
  );

-- Gestor pode marcar suas notificacoes como lidas
CREATE POLICY notificacoes_gestor_update ON notificacoes
  FOR UPDATE
  USING (
    destinatario_tipo = 'gestor'
    AND destinatario_cpf = NULLIF(current_setting('app.current_user_cpf', TRUE), '')
  )
  WITH CHECK (
    destinatario_tipo = 'gestor'
    AND destinatario_cpf = NULLIF(current_setting('app.current_user_cpf', TRUE), '')
  );

COMMENT ON TABLE notificacoes IS 'Sistema de notificacoes em tempo real para admin e gestores';
COMMENT ON COLUMN notificacoes.dados_contexto IS 'JSONB com dados adicionais especificos do tipo de notificacao';
COMMENT ON COLUMN notificacoes.expira_em IS 'Data de expiracao da notificacao (limpeza automatica)';
