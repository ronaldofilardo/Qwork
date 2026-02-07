-- ====================================================================
-- MIGRATION 501: Adicionar empresa_id em funcionarios e lotes_avaliacao
-- ====================================================================
-- Data: 2026-02-06
-- Descrição: 
--   - Formaliza tabela empresas_clientes (se não existir)
--   - Adiciona empresa_id em funcionarios (para RH de clínicas)
--   - Adiciona empresa_id em lotes_avaliacao (para lotes de empresas clientes)
-- ====================================================================

BEGIN;

\echo ''
\echo '========================================='
\echo 'MIGRATION 501: Adicionar empresa_id'
\echo '======================================================================'
\echo ''

-- ====================================================================
-- PARTE 1: GARANTIR EXISTÊNCIA DA TABELA empresas_clientes
-- ====================================================================

\echo 'PARTE 1: Verificando/Criando tabela empresas_clientes...'

DO $$
BEGIN
  -- Criar tabela empresas_clientes se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'empresas_clientes') THEN
    CREATE TABLE empresas_clientes (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      cnpj VARCHAR(18) NOT NULL,
      email VARCHAR(100),
      telefone VARCHAR(20),
      endereco TEXT,
      cidade VARCHAR(50),
      estado VARCHAR(2),
      cep VARCHAR(10),
      ativa BOOLEAN DEFAULT true,
      clinica_id INTEGER NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      -- FK para clínica
      CONSTRAINT empresas_clientes_clinica_id_fkey
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
      
      -- CNPJúnico por clínica
      CONSTRAINT empresas_clientes_clinica_cnpj_unique
        UNIQUE(clinica_id, cnpj)
    );
    
    -- Índices
    CREATE INDEX idx_empresas_clientes_clinica_id ON empresas_clientes(clinica_id);
    CREATE INDEX idx_empresas_clientes_ativa ON empresas_clientes(ativa);
    CREATE INDEX idx_empresas_clientes_cnpj ON empresas_clientes(cnpj);
    
    -- Trigger para atualizar atualizado_em
    CREATE TRIGGER update_empresas_clientes_timestamp
      BEFORE UPDATE ON empresas_clientes
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    
    RAISE NOTICE '✓ Tabela empresas_clientes criada com sucesso';
  ELSE
    RAISE NOTICE '→ Tabela empresas_clientes já existe';
  END IF;
  
  -- RLS para empresas_clientes
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'empresas_clientes' AND rowsecurity = true
  ) THEN
    ALTER TABLE empresas_clientes ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✓ RLS habilitado em empresas_clientes';
  END IF;
  
  -- Policy: RH vê apenas empresas de sua clínica
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'empresas_clientes' AND policyname = 'rh_empresas_proprias'
  ) THEN
    CREATE POLICY rh_empresas_proprias ON empresas_clientes
      FOR ALL
      TO PUBLIC
      USING (
        current_setting('app.current_user_perfil', true) = 'rh'
        AND clinica_id::text = current_setting('app.current_user_clinica_id', true)
      );
    RAISE NOTICE '✓ Policy rh_empresas_proprias criada';
  END IF;
  
  -- Nota: Admin NÃO tem acesso operacional a empresas_clientes
  -- Admin gerencia APENAS aspectos administrativos (tomadores, planos, emissores)
END $$;

-- ====================================================================
-- PARTE 2: ADICIONAR empresa_id EM funcionarios
-- ====================================================================

\echo ''
\echo 'PARTE 2: Adicionando empresa_id em funcionarios...'

DO $$
BEGIN
  -- Adicionar empresa_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'funcionarios' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE funcionarios ADD COLUMN empresa_id INTEGER;
    RAISE NOTICE '✓ Coluna funcionarios.empresa_id adicionada';
  END IF;
  
  -- Criar FK para empresa_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'funcionarios_empresa_id_fkey'
    AND table_name = 'funcionarios'
  ) THEN
    ALTER TABLE funcionarios 
      ADD CONSTRAINT funcionarios_empresa_id_fkey 
      FOREIGN KEY (empresa_id) REFERENCES empresas_clientes(id) ON DELETE CASCADE;
    RAISE NOTICE '✓ FK funcionarios_empresa_id_fkey criada';
  END IF;
  
  -- Criar index para performance
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_funcionarios_empresa_id'
  ) THEN
    CREATE INDEX idx_funcionarios_empresa_id ON funcionarios(empresa_id);
    RAISE NOTICE '✓ Index idx_funcionarios_empresa_id criado';
  END IF;
  
  -- Atualizar check constraint para incluir empresa_id
  -- Funcionários podem ter:
  --   1) entidade_id (funcionários de entidades)
  --   2) clinica_id + empresa_id (funcionários de empresas clientes de clínicas)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'funcionarios_entidade_or_clinica_check'
    AND table_name = 'funcionarios'
  ) THEN
    ALTER TABLE funcionarios DROP CONSTRAINT funcionarios_entidade_or_clinica_check;
    RAISE NOTICE '✓ Check constraint antigo removido';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'funcionarios_entidade_or_clinica_empresa_check'
    AND table_name = 'funcionarios'
  ) THEN
    ALTER TABLE funcionarios 
      ADD CONSTRAINT funcionarios_entidade_or_clinica_empresa_check 
      CHECK (
        (entidade_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL) OR
        (entidade_id IS NULL AND clinica_id IS NOT NULL AND empresa_id IS NOT NULL)
      );
    RAISE NOTICE '✓ Check constraint funcionarios_entidade_or_clinica_empresa_check criado';
  END IF;
END $$;

-- ====================================================================
-- PARTE 3: ADICIONAR empresa_id EM lotes_avaliacao
-- ====================================================================

\echo ''
\echo 'PARTE 3: Adicionando empresa_id em lotes_avaliacao...'

DO $$
BEGIN
  -- Adicionar empresa_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lotes_avaliacao' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE lotes_avaliacao ADD COLUMN empresa_id INTEGER;
    RAISE NOTICE '✓ Coluna lotes_avaliacao.empresa_id adicionada';
  END IF;
  
  -- Criar FK para empresa_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lotes_avaliacao_empresa_id_fkey'
    AND table_name = 'lotes_avaliacao'
  ) THEN
    ALTER TABLE lotes_avaliacao 
      ADD CONSTRAINT lotes_avaliacao_empresa_id_fkey 
      FOREIGN KEY (empresa_id) REFERENCES empresas_clientes(id) ON DELETE CASCADE;
    RAISE NOTICE '✓ FK lotes_avaliacao_empresa_id_fkey criada';
  END IF;
  
  -- Criar index para performance
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_lotes_avaliacao_empresa_id'
  ) THEN
    CREATE INDEX idx_lotes_avaliacao_empresa_id ON lotes_avaliacao(empresa_id);
    RAISE NOTICE '✓ Index idx_lotes_avaliacao_empresa_id criado';
  END IF;
  
  -- Atualizar check constraint para incluir empresa_id
  -- Lotes podem ter:
  --   1) entidade_id (lotes de entidades)
  --   2) clinica_id + empresa_id (lotes de empresas clientes de clínicas)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lotes_avaliacao_clinica_or_entidade_check'
    AND table_name = 'lotes_avaliacao'
  ) THEN
    ALTER TABLE lotes_avaliacao DROP CONSTRAINT lotes_avaliacao_clinica_or_entidade_check;
    RAISE NOTICE '✓ Check constraint antigo removido';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lotes_avaliacao_entidade_or_clinica_empresa_check'
    AND table_name = 'lotes_avaliacao'
  ) THEN
    ALTER TABLE lotes_avaliacao 
      ADD CONSTRAINT lotes_avaliacao_entidade_or_clinica_empresa_check 
      CHECK (
        (entidade_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL) OR
        (entidade_id IS NULL AND clinica_id IS NOT NULL AND empresa_id IS NOT NULL)
      );
    RAISE NOTICE '✓ Check constraint lotes_avaliacao_entidade_or_clinica_empresa_check criado';
  END IF;
END $$;

-- ====================================================================
-- PARTE 4: ATUALIZAR RLS POLICIES
-- ====================================================================

\echo ''
\echo 'PARTE 4: Atualizando RLS policies...'

DO $$
BEGIN
  -- Funcionarios: RH vê funcionários de empresas de sua clínica
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'funcionarios' AND policyname = 'rh_funcionarios_empresas'
  ) THEN
    CREATE POLICY rh_funcionarios_empresas ON funcionarios
      FOR ALL
      TO PUBLIC
      USING (
        current_setting('app.current_user_perfil', true) = 'rh'
        AND (
          clinica_id::text = current_setting('app.current_user_clinica_id', true)
          OR entidade_id IS NOT NULL  -- Funcionarios de entidades não visíveis para RH
        )
      );
    RAISE NOTICE '✓ Policy rh_funcionarios_empresas criada';
  END IF;
  
  -- Lotes: RH vê lotes de empresas de sua clínica
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lotes_avaliacao' AND policyname = 'rh_lotes_empresas'
  ) THEN
    CREATE POLICY rh_lotes_empresas ON lotes_avaliacao
      FOR ALL
      TO PUBLIC
      USING (
        current_setting('app.current_user_perfil', true) = 'rh'
        AND (
          clinica_id::text = current_setting('app.current_user_clinica_id', true)
          OR entidade_id IS NOT NULL  -- Lotes de entidades não visíveis para RH
        )
      );
    RAISE NOTICE '✓ Policy rh_lotes_empresas criada';
  END IF;
END $$;

\echo ''
\echo '======================================================================'
\echo 'MIGRATION 501 CONCLUÍDA COM SUCESSO!'
\echo '======================================================================'
\echo ''
\echo 'Resumo das alterações:'
\echo '  ✓ Tabela empresas_clientes formalizada'
\echo '  ✓ empresa_id adicionado em funcionarios'
\echo '  ✓ empresa_id adicionado em lotes_avaliacao'
\echo '  ✓ Check constraints atualizados'
\echo '  ✓ RLS policies ajustadas'
\echo ''

COMMIT;
