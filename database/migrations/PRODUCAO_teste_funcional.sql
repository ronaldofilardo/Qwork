-- ============================================================================
-- SCRIPT DE TESTE FUNCIONAL - confirmacao_identidade
-- ============================================================================
-- Objetivo: Validar funcionamento da tabela após migração
-- Uso: Execute em uma transação para não poluir o banco
-- ============================================================================

\echo ''
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║  TESTE FUNCIONAL - confirmacao_identidade                      ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''
\echo 'Este script testa a funcionalidade da tabela confirmacao_identidade'
\echo 'Todos os testes são executados em uma TRANSAÇÃO e serão REVERTIDOS'
\echo ''

BEGIN;

\echo '──────────────────────────────────────────────────────────────────'
\echo 'PREPARAÇÃO: Obtendo dados de teste'
\echo '──────────────────────────────────────────────────────────────────'

-- Buscar um funcionário válido para testes
DO $$
DECLARE
  v_cpf CHAR(11);
  v_nome VARCHAR(100);
  v_data_nasc DATE;
  v_avaliacao_id INTEGER;
BEGIN
  -- Buscar funcionário
  SELECT cpf, nome, data_nascimento
  INTO v_cpf, v_nome, v_data_nasc
  FROM funcionarios
  LIMIT 1;
  
  IF v_cpf IS NULL THEN
    RAISE EXCEPTION 'Nenhum funcionário encontrado para testes!';
  END IF;
  
  RAISE NOTICE '✓ Funcionário de teste: % (CPF: %)', v_nome, v_cpf;
  
  -- Buscar uma avaliação (se existir)
  SELECT id INTO v_avaliacao_id
  FROM avaliacoes
  WHERE funcionario_cpf = v_cpf
  LIMIT 1;
  
  IF v_avaliacao_id IS NOT NULL THEN
    RAISE NOTICE '✓ Avaliação de teste: %', v_avaliacao_id;
  ELSE
    RAISE NOTICE '⚠ Nenhuma avaliação encontrada (testaremos com NULL)';
  END IF;
  
  -- Armazenar em variáveis de sessão temporária
  PERFORM set_config('test.cpf', v_cpf, true);
  PERFORM set_config('test.nome', v_nome, true);
  PERFORM set_config('test.data_nasc', v_data_nasc::TEXT, true);
  PERFORM set_config('test.avaliacao_id', COALESCE(v_avaliacao_id::TEXT, 'null'), true);
END $$;

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'TESTE 1: Inserção com avaliação'
\echo '──────────────────────────────────────────────────────────────────'

DO $$
DECLARE
  v_id INTEGER;
  v_cpf TEXT := current_setting('test.cpf', true);
  v_nome TEXT := current_setting('test.nome', true);
  v_data_nasc DATE := current_setting('test.data_nasc', true)::DATE;
  v_avaliacao_id TEXT := current_setting('test.avaliacao_id', true);
BEGIN
  -- Inserir confirmação COM avaliação (se existir)
  IF v_avaliacao_id != 'null' THEN
    INSERT INTO confirmacao_identidade (
      avaliacao_id,
      funcionario_cpf,
      nome_confirmado,
      cpf_confirmado,
      data_nascimento,
      ip_address,
      user_agent
    ) VALUES (
      v_avaliacao_id::INTEGER,
      v_cpf,
      v_nome,
      v_cpf,
      v_data_nasc,
      '192.168.1.100'::INET,
      'Test-Agent/1.0 (Automated Test)'
    )
    RETURNING id INTO v_id;
    
    RAISE NOTICE '✓ TESTE 1 PASSOU: Confirmação inserida com ID %', v_id;
  ELSE
    RAISE NOTICE '⊘ TESTE 1 PULADO: Sem avaliação disponível';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '✗ TESTE 1 FALHOU: %', SQLERRM;
END $$;

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'TESTE 2: Inserção SEM avaliação (contexto login)'
\echo '──────────────────────────────────────────────────────────────────'

DO $$
DECLARE
  v_id INTEGER;
  v_cpf TEXT := current_setting('test.cpf', true);
  v_nome TEXT := current_setting('test.nome', true);
  v_data_nasc DATE := current_setting('test.data_nasc', true)::DATE;
BEGIN
  -- Inserir confirmação SEM avaliação (NULL)
  INSERT INTO confirmacao_identidade (
    avaliacao_id,  -- NULL
    funcionario_cpf,
    nome_confirmado,
    cpf_confirmado,
    data_nascimento,
    ip_address,
    user_agent
  ) VALUES (
    NULL,  -- Confirmação no contexto de login
    v_cpf,
    v_nome,
    v_cpf,
    v_data_nasc,
    '192.168.1.101'::INET,
    'Test-Agent/1.0 (Login Context Test)'
  )
  RETURNING id INTO v_id;
  
  RAISE NOTICE '✓ TESTE 2 PASSOU: Confirmação de login inserida com ID %', v_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '✗ TESTE 2 FALHOU: %', SQLERRM;
END $$;

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'TESTE 3: Constraint CPF match'
\echo '──────────────────────────────────────────────────────────────────'

DO $$
DECLARE
  v_cpf TEXT := current_setting('test.cpf', true);
  v_nome TEXT := current_setting('test.nome', true);
  v_data_nasc DATE := current_setting('test.data_nasc', true)::DATE;
  v_erro TEXT;
BEGIN
  -- Tentar inserir com CPF confirmado diferente do funcionario_cpf
  -- Deve FALHAR devido ao CHECK constraint
  BEGIN
    INSERT INTO confirmacao_identidade (
      funcionario_cpf,
      nome_confirmado,
      cpf_confirmado,  -- Diferente do funcionario_cpf
      data_nascimento,
      ip_address
    ) VALUES (
      v_cpf,
      v_nome,
      '00000000000',  -- CPF inválido diferente
      v_data_nasc,
      '192.168.1.102'::INET
    );
    
    -- Se chegou aqui, o constraint não funcionou
    RAISE EXCEPTION '✗ TESTE 3 FALHOU: Constraint CPF match não impediu inserção inválida!';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✓ TESTE 3 PASSOU: Constraint CPF match funcionando corretamente';
    WHEN OTHERS THEN
      RAISE EXCEPTION '✗ TESTE 3 FALHOU: Erro inesperado: %', SQLERRM;
  END;
END $$;

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'TESTE 4: Foreign Key funcionario_cpf'
\echo '──────────────────────────────────────────────────────────────────'

DO $$
DECLARE
  v_nome TEXT := current_setting('test.nome', true);
  v_data_nasc DATE := current_setting('test.data_nasc', true)::DATE;
BEGIN
  -- Tentar inserir com CPF inexistente
  -- Deve FALHAR devido ao FK constraint
  BEGIN
    INSERT INTO confirmacao_identidade (
      funcionario_cpf,
      nome_confirmado,
      cpf_confirmado,
      data_nascimento,
      ip_address
    ) VALUES (
      '99999999999',  -- CPF inexistente
      v_nome,
      '99999999999',
      v_data_nasc,
      '192.168.1.103'::INET
    );
    
    RAISE EXCEPTION '✗ TESTE 4 FALHOU: FK funcionario_cpf não impediu inserção inválida!';
  EXCEPTION
    WHEN foreign_key_violation THEN
      RAISE NOTICE '✓ TESTE 4 PASSOU: FK funcionario_cpf funcionando corretamente';
    WHEN OTHERS THEN
      RAISE EXCEPTION '✗ TESTE 4 FALHOU: Erro inesperado: %', SQLERRM;
  END;
END $$;

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'TESTE 5: Foreign Key avaliacao_id'
\echo '──────────────────────────────────────────────────────────────────'

DO $$
DECLARE
  v_cpf TEXT := current_setting('test.cpf', true);
  v_nome TEXT := current_setting('test.nome', true);
  v_data_nasc DATE := current_setting('test.data_nasc', true)::DATE;
BEGIN
  -- Tentar inserir com avaliacao_id inexistente
  -- Deve FALHAR devido ao FK constraint
  BEGIN
    INSERT INTO confirmacao_identidade (
      avaliacao_id,
      funcionario_cpf,
      nome_confirmado,
      cpf_confirmado,
      data_nascimento,
      ip_address
    ) VALUES (
      999999999,  -- ID de avaliação inexistente
      v_cpf,
      v_nome,
      v_cpf,
      v_data_nasc,
      '192.168.1.104'::INET
    );
    
    RAISE EXCEPTION '✗ TESTE 5 FALHOU: FK avaliacao_id não impediu inserção inválida!';
  EXCEPTION
    WHEN foreign_key_violation THEN
      RAISE NOTICE '✓ TESTE 5 PASSOU: FK avaliacao_id funcionando corretamente';
    WHEN OTHERS THEN
      RAISE EXCEPTION '✗ TESTE 5 FALHOU: Erro inesperado: %', SQLERRM;
  END;
END $$;

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'TESTE 6: Campos com valores padrão'
\echo '──────────────────────────────────────────────────────────────────'

DO $$
DECLARE
  v_id INTEGER;
  v_confirmado_em TIMESTAMP WITH TIME ZONE;
  v_criado_em TIMESTAMP WITH TIME ZONE;
  v_cpf TEXT := current_setting('test.cpf', true);
  v_nome TEXT := current_setting('test.nome', true);
  v_data_nasc DATE := current_setting('test.data_nasc', true)::DATE;
BEGIN
  -- Inserir sem especificar confirmado_em e criado_em
  -- Devem usar DEFAULT (CURRENT_TIMESTAMP)
  INSERT INTO confirmacao_identidade (
    funcionario_cpf,
    nome_confirmado,
    cpf_confirmado,
    data_nascimento
  ) VALUES (
    v_cpf,
    v_nome,
    v_cpf,
    v_data_nasc
  )
  RETURNING id, confirmado_em, criado_em
  INTO v_id, v_confirmado_em, v_criado_em;
  
  -- Verificar se os timestamps foram preenchidos
  IF v_confirmado_em IS NULL THEN
    RAISE EXCEPTION '✗ TESTE 6 FALHOU: confirmado_em não foi preenchido com DEFAULT';
  END IF;
  
  IF v_criado_em IS NULL THEN
    RAISE EXCEPTION '✗ TESTE 6 FALHOU: criado_em não foi preenchido com DEFAULT';
  END IF;
  
  -- Verificar se são timestamps recentes (últimos 10 segundos)
  IF v_confirmado_em < NOW() - INTERVAL '10 seconds' THEN
    RAISE EXCEPTION '✗ TESTE 6 FALHOU: confirmado_em não é timestamp recente';
  END IF;
  
  RAISE NOTICE '✓ TESTE 6 PASSOU: Campos com DEFAULT funcionando corretamente';
  RAISE NOTICE '  confirmado_em: %', v_confirmado_em;
  RAISE NOTICE '  criado_em: %', v_criado_em;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '✗ TESTE 6 FALHOU: %', SQLERRM;
END $$;

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'TESTE 7: Índices de busca'
\echo '──────────────────────────────────────────────────────────────────'

DO $$
DECLARE
  v_plan TEXT;
  v_usa_indice BOOLEAN;
  v_cpf TEXT := current_setting('test.cpf', true);
BEGIN
  -- Verificar se a busca por funcionario_cpf usa índice
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'confirmacao_identidade'
    AND indexdef LIKE '%funcionario_cpf%'
  ) INTO v_usa_indice;
  
  IF v_usa_indice THEN
    RAISE NOTICE '✓ TESTE 7.1 PASSOU: Índice idx_confirmacao_funcionario_cpf existe';
  ELSE
    RAISE EXCEPTION '✗ TESTE 7.1 FALHOU: Índice funcionario_cpf não encontrado';
  END IF;
  
  -- Verificar índice de avaliacao_id
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'confirmacao_identidade'
    AND indexdef LIKE '%avaliacao_id%'
  ) INTO v_usa_indice;
  
  IF v_usa_indice THEN
    RAISE NOTICE '✓ TESTE 7.2 PASSOU: Índice idx_confirmacao_avaliacao_id existe';
  ELSE
    RAISE EXCEPTION '✗ TESTE 7.2 FALHOU: Índice avaliacao_id não encontrado';
  END IF;
  
  -- Verificar índice de data
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'confirmacao_identidade'
    AND indexdef LIKE '%confirmado_em%'
  ) INTO v_usa_indice;
  
  IF v_usa_indice THEN
    RAISE NOTICE '✓ TESTE 7.3 PASSOU: Índice idx_confirmacao_data existe';
  ELSE
    RAISE EXCEPTION '✗ TESTE 7.3 FALHOU: Índice confirmado_em não encontrado';
  END IF;
END $$;

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'TESTE 8: RLS Habilitado'
\echo '──────────────────────────────────────────────────────────────────'

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_policy_count INTEGER;
BEGIN
  -- Verificar se RLS está habilitado
  SELECT relrowsecurity INTO v_rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  AND c.relname = 'confirmacao_identidade';
  
  IF v_rls_enabled THEN
    RAISE NOTICE '✓ TESTE 8.1 PASSOU: RLS habilitado';
  ELSE
    RAISE EXCEPTION '✗ TESTE 8.1 FALHOU: RLS não está habilitado!';
  END IF;
  
  -- Contar políticas RLS
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'confirmacao_identidade';
  
  IF v_policy_count = 5 THEN
    RAISE NOTICE '✓ TESTE 8.2 PASSOU: 5 políticas RLS criadas';
  ELSE
    RAISE EXCEPTION '✗ TESTE 8.2 FALHOU: Esperadas 5 políticas, encontradas %', v_policy_count;
  END IF;
END $$;

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'TESTE 9: Comentários da tabela'
\echo '──────────────────────────────────────────────────────────────────'

DO $$
DECLARE
  v_table_comment TEXT;
  v_column_comments INTEGER;
BEGIN
  -- Verificar comentário da tabela
  SELECT obj_description('confirmacao_identidade'::regclass) INTO v_table_comment;
  
  IF v_table_comment IS NOT NULL THEN
    RAISE NOTICE '✓ TESTE 9.1 PASSOU: Comentário da tabela existe';
  ELSE
    RAISE WARNING '⚠ TESTE 9.1 AVISO: Comentário da tabela não encontrado';
  END IF;
  
  -- Contar comentários de colunas
  SELECT COUNT(*) INTO v_column_comments
  FROM pg_description d
  JOIN pg_class c ON c.oid = d.objoid
  WHERE c.relname = 'confirmacao_identidade'
  AND d.objsubid > 0;
  
  IF v_column_comments > 0 THEN
    RAISE NOTICE '✓ TESTE 9.2 PASSOU: % colunas com comentários', v_column_comments;
  ELSE
    RAISE WARNING '⚠ TESTE 9.2 AVISO: Nenhuma coluna com comentário';
  END IF;
END $$;

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'TESTE 10: Performance de inserção em lote'
\echo '──────────────────────────────────────────────────────────────────'

DO $$
DECLARE
  v_start TIMESTAMP;
  v_end TIMESTAMP;
  v_duration INTERVAL;
  v_cpf TEXT := current_setting('test.cpf', true);
  v_nome TEXT := current_setting('test.nome', true);
  v_data_nasc DATE := current_setting('test.data_nasc', true)::DATE;
  v_count INTEGER;
BEGIN
  v_start := clock_timestamp();
  
  -- Inserir 100 registros
  INSERT INTO confirmacao_identidade (
    funcionario_cpf,
    nome_confirmado,
    cpf_confirmado,
    data_nascimento,
    ip_address,
    user_agent
  )
  SELECT 
    v_cpf,
    v_nome,
    v_cpf,
    v_data_nasc,
    ('192.168.1.' || i::TEXT)::INET,
    'Test-Agent/Bulk-' || i::TEXT
  FROM generate_series(1, 100) i;
  
  v_end := clock_timestamp();
  v_duration := v_end - v_start;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RAISE NOTICE '✓ TESTE 10 PASSOU: % inserções em %', v_count, v_duration;
  
  IF v_duration > INTERVAL '5 seconds' THEN
    RAISE WARNING '⚠ Performance pode estar degradada (> 5 segundos para 100 inserções)';
  END IF;
END $$;

-- ============================================================================
-- RESUMO DOS TESTES
-- ============================================================================

\echo ''
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║  RESUMO DOS TESTES                                             ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''

SELECT 
  COUNT(*) as total_confirmacoes_teste,
  COUNT(DISTINCT funcionario_cpf) as funcionarios_unicos,
  COUNT(*) FILTER (WHERE avaliacao_id IS NULL) as confirmacoes_login,
  COUNT(*) FILTER (WHERE avaliacao_id IS NOT NULL) as confirmacoes_avaliacao,
  MIN(confirmado_em) as primeira_confirmacao,
  MAX(confirmado_em) as ultima_confirmacao
FROM confirmacao_identidade;

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'Revertendo transação (limpando dados de teste)...'
\echo '──────────────────────────────────────────────────────────────────'

ROLLBACK;

\echo ''
\echo '✓ Todos os dados de teste foram revertidos'
\echo ''
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║  TESTES CONCLUÍDOS COM SUCESSO!                                ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''
