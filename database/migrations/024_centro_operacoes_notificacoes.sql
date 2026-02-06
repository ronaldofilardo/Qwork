-- Migration 024: Centro de Operações - Notificações Persistentes
-- Evolui o sistema de notificações para Centro de Operações com persistência até resolução

-- ==========================================
-- FASE 0: CRIAR TABELA DE AUDITORIA (SE NÃO EXISTIR)
-- ==========================================

CREATE TABLE IF NOT EXISTS auditoria_geral (
  id SERIAL PRIMARY KEY,
  tabela_afetada VARCHAR(100) NOT NULL,
  acao VARCHAR(50) NOT NULL,
  cpf_responsavel VARCHAR(11),
  dados_anteriores JSONB,
  dados_novos JSONB,
  criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_geral_tabela ON auditoria_geral(tabela_afetada);
CREATE INDEX IF NOT EXISTS idx_auditoria_geral_cpf ON auditoria_geral(cpf_responsavel);
CREATE INDEX IF NOT EXISTS idx_auditoria_geral_criado_em ON auditoria_geral(criado_em DESC);

-- ==========================================
-- FASE 1: ADICIONAR COLUNAS DE RESOLUÇÃO
-- ==========================================

-- Adicionar coluna de resolução (não só leitura)
ALTER TABLE notificacoes
  ADD COLUMN IF NOT EXISTS resolvida BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS data_resolucao TIMESTAMP,
  ADD COLUMN IF NOT EXISTS resolvido_por_cpf VARCHAR(11);

-- Adicionar índice para performance de filtros
CREATE INDEX IF NOT EXISTS idx_notificacoes_resolvida ON notificacoes (resolvida) WHERE resolvida = FALSE;
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo_resolvida ON notificacoes (tipo, resolvida);

-- ==========================================
-- FASE 2: NOVOS TIPOS DE NOTIFICAÇÃO
-- ==========================================

-- Adicionar novos tipos de notificação para Centro de Operações
ALTER TYPE tipo_notificacao ADD VALUE IF NOT EXISTS 'parcela_pendente';
ALTER TYPE tipo_notificacao ADD VALUE IF NOT EXISTS 'parcela_vencendo';
ALTER TYPE tipo_notificacao ADD VALUE IF NOT EXISTS 'quitacao_completa';
ALTER TYPE tipo_notificacao ADD VALUE IF NOT EXISTS 'lote_concluido_aguardando_laudo';
ALTER TYPE tipo_notificacao ADD VALUE IF NOT EXISTS 'laudo_emitido';
ALTER TYPE tipo_notificacao ADD VALUE IF NOT EXISTS 'relatorio_semanal_pendencias';

-- ==========================================
-- FASE 3: ATUALIZAR TIPOS DE DESTINATÁRIO
-- ==========================================

-- Permitir destinatários contratante e clinica (além dos existentes)
ALTER TABLE notificacoes
  DROP CONSTRAINT IF EXISTS notificacoes_destinatario_tipo_check;

ALTER TABLE notificacoes
  ADD CONSTRAINT notificacoes_destinatario_tipo_check
  CHECK (destinatario_tipo IN ('admin', 'gestor', 'funcionario', 'contratante', 'clinica'));

-- ==========================================
-- FASE 4: FUNÇÃO PARA RESOLVER NOTIFICAÇÕES
-- ==========================================

CREATE OR REPLACE FUNCTION resolver_notificacao(
  p_notificacao_id INTEGER,
  p_cpf_resolvedor VARCHAR(11)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_row_count INTEGER;
  v_updated BOOLEAN;
BEGIN
  UPDATE notificacoes
  SET resolvida = TRUE,
      data_resolucao = NOW(),
      resolvido_por_cpf = p_cpf_resolvedor
  WHERE id = p_notificacao_id
    AND resolvida = FALSE;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_updated := (v_row_count > 0);
  
  -- Registrar auditoria
  IF v_updated THEN
    INSERT INTO auditoria_geral (
      tabela_afetada, acao, cpf_responsavel, 
      dados_anteriores, dados_novos, criado_em
    ) VALUES (
      'notificacoes', 
      'RESOLVE', 
      p_cpf_resolvedor,
      jsonb_build_object('notificacao_id', p_notificacao_id, 'resolvida', false),
      jsonb_build_object('notificacao_id', p_notificacao_id, 'resolvida', true),
      NOW()
    );
  END IF;
  
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- FASE 5: FUNÇÃO PARA RESOLVER POR CONTEXTO
-- ==========================================

CREATE OR REPLACE FUNCTION resolver_notificacoes_por_contexto(
  p_chave_contexto TEXT,
  p_valor_contexto TEXT,
  p_cpf_resolvedor VARCHAR(11)
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Resolver todas as notificações com chave/valor específico no contexto
  UPDATE notificacoes
  SET resolvida = TRUE,
      data_resolucao = NOW(),
      resolvido_por_cpf = p_cpf_resolvedor
  WHERE dados_contexto->>p_chave_contexto = p_valor_contexto
    AND resolvida = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Registrar auditoria
  IF v_count > 0 THEN
    INSERT INTO auditoria_geral (
      tabela_afetada, acao, cpf_responsavel, 
      dados_anteriores, dados_novos, criado_em
    ) VALUES (
      'notificacoes', 
      'RESOLVE_BULK', 
      p_cpf_resolvedor,
      jsonb_build_object('criterio', p_chave_contexto, 'valor', p_valor_contexto),
      jsonb_build_object('notificacoes_resolvidas', v_count),
      NOW()
    );
  END IF;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- FASE 6: ATUALIZAR POLÍTICAS RLS
-- ==========================================

-- Remover política antiga de gestor
DROP POLICY IF EXISTS notificacoes_gestor_own ON notificacoes;
DROP POLICY IF EXISTS notificacoes_gestor_update ON notificacoes;

-- Nova política para contratantes (entidades)
CREATE POLICY notificacoes_contratante_own ON notificacoes
  FOR SELECT
  TO PUBLIC
  USING (
    destinatario_tipo = 'contratante'
    AND destinatario_cpf = current_setting('app.user_cpf', TRUE)
  );

CREATE POLICY notificacoes_contratante_update ON notificacoes
  FOR UPDATE
  TO PUBLIC
  USING (
    destinatario_tipo = 'contratante'
    AND destinatario_cpf = current_setting('app.user_cpf', TRUE)
  )
  WITH CHECK (
    destinatario_tipo = 'contratante'
    AND destinatario_cpf = current_setting('app.user_cpf', TRUE)
  );

-- Nova política para clínicas
CREATE POLICY notificacoes_clinica_own ON notificacoes
  FOR SELECT
  TO PUBLIC
  USING (
    destinatario_tipo = 'clinica'
    AND destinatario_cpf = current_setting('app.user_cpf', TRUE)
  );

CREATE POLICY notificacoes_clinica_update ON notificacoes
  FOR UPDATE
  TO PUBLIC
  USING (
    destinatario_tipo = 'clinica'
    AND destinatario_cpf = current_setting('app.user_cpf', TRUE)
  )
  WITH CHECK (
    destinatario_tipo = 'clinica'
    AND destinatario_cpf = current_setting('app.user_cpf', TRUE)
  );

-- ==========================================
-- FASE 7: FUNÇÃO DE LIMPEZA AUTOMÁTICA
-- ==========================================

CREATE OR REPLACE FUNCTION limpar_notificacoes_resolvidas_antigas()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Arquivar notificações resolvidas há mais de 90 dias
  UPDATE notificacoes
  SET arquivada = TRUE
  WHERE resolvida = TRUE
    AND data_resolucao < NOW() - INTERVAL '90 days'
    AND arquivada = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- COMENTÁRIOS
-- ==========================================

COMMENT ON COLUMN notificacoes.resolvida IS 'Indica se a notificação foi resolvida (ação tomada), diferente de apenas lida';
COMMENT ON COLUMN notificacoes.data_resolucao IS 'Data/hora em que a notificação foi marcada como resolvida';
COMMENT ON COLUMN notificacoes.resolvido_por_cpf IS 'CPF do usuário que resolveu a notificação';
COMMENT ON FUNCTION resolver_notificacao IS 'Marca uma notificação como resolvida e registra auditoria';
COMMENT ON FUNCTION resolver_notificacoes_por_contexto IS 'Resolve múltiplas notificações com base em critério de contexto (ex: lote_id)';
COMMENT ON FUNCTION limpar_notificacoes_resolvidas_antigas IS 'Arquiva notificações resolvidas há mais de 90 dias';
