-- Migration: Criar tabela confirmacao_identidade
-- Objetivo: Registrar confirmações de identidade para fins de auditoria jurídica
-- Data: 2026-02-12

-- ============================================================================
-- TABELA: confirmacao_identidade
-- ============================================================================
-- Registra quando um funcionário confirma sua identidade antes de responder avaliação
-- Necessário para garantir validade jurídica das respostas

CREATE TABLE IF NOT EXISTS confirmacao_identidade (
  id SERIAL PRIMARY KEY,
  avaliacao_id INTEGER NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
  funcionario_cpf CHAR(11) NOT NULL REFERENCES funcionarios(cpf) ON DELETE CASCADE,
  
  -- Dados confirmados pelo funcionário
  nome_confirmado VARCHAR(100) NOT NULL,
  cpf_confirmado CHAR(11) NOT NULL,
  data_nascimento DATE NOT NULL,
  
  -- Contexto da confirmação
  confirmado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  
  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES avaliacoes(id) ON DELETE CASCADE,
  CONSTRAINT fk_funcionario FOREIGN KEY (funcionario_cpf) REFERENCES funcionarios(cpf) ON DELETE CASCADE,
  CONSTRAINT cpf_confirmado_match CHECK (cpf_confirmado = funcionario_cpf)
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Busca rápida por avaliação (auditoria)
CREATE INDEX idx_confirmacao_avaliacao_id ON confirmacao_identidade(avaliacao_id);

-- Busca rápida por funcionário (histórico)
CREATE INDEX idx_confirmacao_funcionario_cpf ON confirmacao_identidade(funcionario_cpf);

-- Busca por data de confirmação
CREATE INDEX idx_confirmacao_data ON confirmacao_identidade(confirmado_em);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE confirmacao_identidade IS 'Registros de confirmação de identidade para fins de auditoria jurídica';
COMMENT ON COLUMN confirmacao_identidade.avaliacao_id IS 'ID da avaliação confirmada';
COMMENT ON COLUMN confirmacao_identidade.funcionario_cpf IS 'CPF do funcionário que confirmou';
COMMENT ON COLUMN confirmacao_identidade.nome_confirmado IS 'Nome exibido na confirmação';
COMMENT ON COLUMN confirmacao_identidade.cpf_confirmado IS 'CPF exibido na confirmação (deve ser igual ao funcionario_cpf)';
COMMENT ON COLUMN confirmacao_identidade.data_nascimento IS 'Data de nascimento exibida na confirmação';
COMMENT ON COLUMN confirmacao_identidade.confirmado_em IS 'Data/hora em que a confirmação foi realizada';
COMMENT ON COLUMN confirmacao_identidade.ip_address IS 'Endereço IP de origem da confirmação';
COMMENT ON COLUMN confirmacao_identidade.user_agent IS 'User-Agent do navegador usado na confirmação';

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE confirmacao_identidade ENABLE ROW LEVEL SECURITY;

-- Política: Funcionários podem visualizar apenas suas próprias confirmações
CREATE POLICY funcionario_view_own_confirmations ON confirmacao_identidade
  FOR SELECT
  TO funcionario_role
  USING (funcionario_cpf = current_setting('app.current_user_cpf', true)::TEXT);

-- Política: RH pode visualizar confirmações dos funcionários da sua clínica
CREATE POLICY rh_view_clinic_confirmations ON confirmacao_identidade
  FOR SELECT
  TO rh_role
  USING (
    EXISTS (
      SELECT 1 FROM funcionarios f
      WHERE f.cpf = confirmacao_identidade.funcionario_cpf
      AND f.clinica_id::TEXT = current_setting('app.current_user_clinica_id', true)
    )
  );

-- Política: Gestor pode visualizar confirmações dos funcionários da sua entidade
CREATE POLICY gestor_view_entity_confirmations ON confirmacao_identidade
  FOR SELECT
  TO gestor_entidade_role
  USING (
    EXISTS (
      SELECT 1 FROM funcionarios f
      WHERE f.cpf = confirmacao_identidade.funcionario_cpf
      AND f.entidade_id::TEXT = current_setting('app.current_user_entidade_id', true)
    )
  );

-- Política: Admin e Emissor têm acesso total
CREATE POLICY admin_emissor_full_access ON confirmacao_identidade
  FOR ALL
  TO admin_role, emissor_role
  USING (true)
  WITH CHECK (true);

-- Política: Inserção permitida apenas pelo sistema (via API autenticada)
CREATE POLICY system_insert_confirmations ON confirmacao_identidade
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- AUDITORIA
-- ============================================================================

-- Trigger para registrar em auditoria_geral quando uma confirmação é criada
CREATE OR REPLACE FUNCTION registrar_auditoria_confirmacao_identidade()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auditoria_geral (
    entidade_tipo,
    entidade_id,
    acao,
    usuario_cpf,
    metadados,
    criado_em
  ) VALUES (
    'confirmacao_identidade',
    NEW.id,
    'identidade_confirmada',
    NEW.funcionario_cpf,
    jsonb_build_object(
      'avaliacao_id', NEW.avaliacao_id,
      'nome', NEW.nome_confirmado,
      'data_nascimento', NEW.data_nascimento,
      'ip_address', NEW.ip_address::TEXT,
      'user_agent', NEW.user_agent
    ),
    NEW.confirmado_em
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auditoria_confirmacao_identidade
  AFTER INSERT ON confirmacao_identidade
  FOR EACH ROW
  EXECUTE FUNCTION registrar_auditoria_confirmacao_identidade();

COMMENT ON FUNCTION registrar_auditoria_confirmacao_identidade() IS 'Registra confirmações de identidade na tabela de auditoria geral';
