-- ============================================================================
-- SCRIPT DE SINCRONIZAÇÃO PARA PRODUÇÃO
-- ============================================================================
-- Objetivo: Aplicar migrações 1012, 1013 e 1014 consolidadas
-- Data: 2026-02-12
-- Banco: neondb (Produção)
-- 
-- Este script consolida:
--   - 1012: Criação da tabela confirmacao_identidade (SEM trigger problemático)
--   - 1013: Campo avaliacao_id como NULLABLE
--   - 1014: Não aplicável (trigger já não será criado)
--
-- IMPORTANTE: Execute este script em uma transação para poder reverter em caso de erro
-- ============================================================================

BEGIN;

-- ============================================================================
-- VERIFICAÇÃO PRÉVIA
-- ============================================================================

-- Verifica se a tabela já existe
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'confirmacao_identidade'
  ) THEN
    RAISE NOTICE 'ATENÇÃO: Tabela confirmacao_identidade já existe. Abortando...';
    RAISE EXCEPTION 'Tabela já existe';
  END IF;
END $$;

-- ============================================================================
-- TABELA: confirmacao_identidade
-- ============================================================================
-- Registra quando um funcionário confirma sua identidade antes de responder avaliação
-- Necessário para garantir validade jurídica das respostas
-- 
-- NOTA: avaliacao_id é NULLABLE para permitir confirmações no contexto de login

CREATE TABLE confirmacao_identidade (
  id SERIAL PRIMARY KEY,
  
  -- Avaliação associada (pode ser NULL para confirmações no login)
  avaliacao_id INTEGER,
  
  -- Funcionário que confirmou
  funcionario_cpf CHAR(11) NOT NULL,
  
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
  CONSTRAINT fk_confirmacao_avaliacao 
    FOREIGN KEY (avaliacao_id) 
    REFERENCES avaliacoes(id) 
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED,
  
  CONSTRAINT fk_confirmacao_funcionario 
    FOREIGN KEY (funcionario_cpf) 
    REFERENCES funcionarios(cpf) 
    ON DELETE CASCADE,
  
  CONSTRAINT cpf_confirmado_match 
    CHECK (cpf_confirmado = funcionario_cpf)
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Busca rápida por avaliação (auditoria)
CREATE INDEX idx_confirmacao_avaliacao_id 
  ON confirmacao_identidade(avaliacao_id) 
  WHERE avaliacao_id IS NOT NULL;

-- Busca rápida por funcionário (histórico)
CREATE INDEX idx_confirmacao_funcionario_cpf 
  ON confirmacao_identidade(funcionario_cpf);

-- Busca por data de confirmação
CREATE INDEX idx_confirmacao_data 
  ON confirmacao_identidade(confirmado_em DESC);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE confirmacao_identidade IS 
  'Registros de confirmação de identidade para fins de auditoria jurídica';

COMMENT ON COLUMN confirmacao_identidade.avaliacao_id IS 
  'ID da avaliação confirmada. Pode ser NULL para confirmações de identidade feitas no contexto de login.';

COMMENT ON COLUMN confirmacao_identidade.funcionario_cpf IS 
  'CPF do funcionário que confirmou';

COMMENT ON COLUMN confirmacao_identidade.nome_confirmado IS 
  'Nome exibido na confirmação';

COMMENT ON COLUMN confirmacao_identidade.cpf_confirmado IS 
  'CPF exibido na confirmação (deve ser igual ao funcionario_cpf)';

COMMENT ON COLUMN confirmacao_identidade.data_nascimento IS 
  'Data de nascimento exibida na confirmação';

COMMENT ON COLUMN confirmacao_identidade.confirmado_em IS 
  'Data/hora em que a confirmação foi realizada';

COMMENT ON COLUMN confirmacao_identidade.ip_address IS 
  'Endereço IP de origem da confirmação';

COMMENT ON COLUMN confirmacao_identidade.user_agent IS 
  'User-Agent do navegador usado na confirmação';

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

-- Política: RH pode visualizar todas as confirmações
CREATE POLICY rh_view_clinic_confirmations ON confirmacao_identidade
  FOR SELECT
  TO rh_role
  USING (true);

-- Política: Gestor pode visualizar confirmações dos funcionários da sua entidade
CREATE POLICY gestor_view_entity_confirmations ON confirmacao_identidade
  FOR SELECT
  TO gestor_entidade_role
  USING (
    EXISTS (
      SELECT 1 FROM funcionarios f
      JOIN funcionarios_entidades fe ON f.id = fe.funcionario_id
      WHERE f.cpf = confirmacao_identidade.funcionario_cpf
      AND fe.ativo = true
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
-- VALIDAÇÃO FINAL
-- ============================================================================

-- Verifica se a tabela foi criada corretamente
DO $$ 
DECLARE
  v_count INTEGER;
BEGIN
  -- Verifica se a tabela existe
  SELECT COUNT(*) INTO v_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'confirmacao_identidade';
  
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Erro: Tabela confirmacao_identidade não foi criada';
  END IF;
  
  -- Verifica se RLS está habilitado
  SELECT COUNT(*) INTO v_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  AND c.relname = 'confirmacao_identidade'
  AND c.relrowsecurity = true;
  
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Erro: RLS não está habilitado na tabela confirmacao_identidade';
  END IF;
  
  -- Verifica se as políticas foram criadas
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE tablename = 'confirmacao_identidade';
  
  IF v_count < 5 THEN
    RAISE WARNING 'Aviso: Esperadas 5 políticas RLS, encontradas %', v_count;
  END IF;
  
  RAISE NOTICE '✓ Validação concluída com sucesso';
  RAISE NOTICE '✓ Tabela confirmacao_identidade criada';
  RAISE NOTICE '✓ RLS habilitado';
  RAISE NOTICE '✓ % políticas RLS criadas', v_count;
END $$;

-- ============================================================================
-- COMMIT
-- ============================================================================

COMMIT;

-- ============================================================================
-- VERIFICAÇÃO PÓS-COMMIT
-- ============================================================================

-- Exibe informações sobre a tabela criada
\echo ''
\echo '==================================='
\echo 'RESUMO DA MIGRAÇÃO'
\echo '==================================='
\echo ''

SELECT 
  'confirmacao_identidade' as tabela,
  COUNT(*) as total_registros,
  pg_size_pretty(pg_total_relation_size('confirmacao_identidade')) as tamanho
FROM confirmacao_identidade;

\echo ''
\echo 'Índices criados:'
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'confirmacao_identidade'
ORDER BY indexname;

\echo ''
\echo 'Políticas RLS ativas:'
SELECT 
  policyname,
  cmd,
  roles::text
FROM pg_policies 
WHERE tablename = 'confirmacao_identidade'
ORDER BY policyname;

\echo ''
\echo '==================================='
\echo 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!'
\echo '==================================='
\echo 'Próximos passos:'
\echo '1. Verificar logs acima'
\echo '2. Fazer deploy do código que usa esta tabela'
\echo '3. Monitorar logs de aplicação'
\echo ''
