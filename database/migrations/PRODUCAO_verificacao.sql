-- ============================================================================
-- SCRIPT DE VERIFICAÇÃO PRÉ/PÓS-MIGRAÇÃO
-- ============================================================================
-- Objetivo: Validar estado do banco antes e depois da sincronização
-- Uso: Execute ANTES e DEPOIS da migração para comparar
-- ============================================================================

\echo ''
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║  VERIFICAÇÃO DE ESTADO DO BANCO - PRODUÇÃO                     ║'
\echo '║  Data: 2026-02-12                                              ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''

-- ============================================================================
-- SEÇÃO 1: INFORMAÇÕES DO BANCO
-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo '1. INFORMAÇÕES GERAIS DO BANCO'
\echo '──────────────────────────────────────────────────────────────────'

SELECT 
  current_database() as banco,
  current_user as usuario,
  version() as versao_postgres,
  now() as data_verificacao;

\echo ''

-- ============================================================================
-- SEÇÃO 2: VERIFICAÇÃO DE TABELAS DE DEPENDÊNCIA
-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo '2. TABELAS DE DEPENDÊNCIA (devem existir)'
\echo '──────────────────────────────────────────────────────────────────'

SELECT 
  t.tablename as tabela,
  CASE 
    WHEN t.tablename IS NOT NULL THEN '✓ EXISTE'
    ELSE '✗ NÃO EXISTE'
  END as status,
  (SELECT COUNT(*) FROM avaliacoes) as registros_avaliacoes,
  (SELECT COUNT(*) FROM funcionarios) as registros_funcionarios
FROM (VALUES ('avaliacoes'), ('funcionarios')) AS expected(tablename)
LEFT JOIN pg_tables t 
  ON t.tablename = expected.tablename 
  AND t.schemaname = 'public';

\echo ''

-- ============================================================================
-- SEÇÃO 3: VERIFICAÇÃO DA TABELA confirmacao_identidade
-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo '3. TABELA confirmacao_identidade'
\echo '──────────────────────────────────────────────────────────────────'

DO $$ 
DECLARE
  v_existe BOOLEAN;
  v_rls_habilitado BOOLEAN;
  v_politicas INTEGER;
  v_indices INTEGER;
  v_registros INTEGER;
BEGIN
  -- Verifica se tabela existe
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'confirmacao_identidade'
  ) INTO v_existe;
  
  IF v_existe THEN
    RAISE NOTICE '✓ Tabela confirmacao_identidade: EXISTE';
    
    -- Verifica RLS
    SELECT c.relrowsecurity INTO v_rls_habilitado
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname = 'confirmacao_identidade';
    
    IF v_rls_habilitado THEN
      RAISE NOTICE '  ✓ RLS: HABILITADO';
    ELSE
      RAISE WARNING '  ✗ RLS: DESABILITADO';
    END IF;
    
    -- Conta políticas
    SELECT COUNT(*) INTO v_politicas
    FROM pg_policies
    WHERE tablename = 'confirmacao_identidade';
    
    RAISE NOTICE '  ✓ Políticas RLS: % (esperado: 5)', v_politicas;
    
    -- Conta índices
    SELECT COUNT(*) INTO v_indices
    FROM pg_indexes
    WHERE tablename = 'confirmacao_identidade';
    
    RAISE NOTICE '  ✓ Índices: % (esperado: 4)', v_indices;
    
    -- Conta registros
    EXECUTE 'SELECT COUNT(*) FROM confirmacao_identidade' INTO v_registros;
    RAISE NOTICE '  ✓ Registros: %', v_registros;
    
  ELSE
    RAISE NOTICE '✗ Tabela confirmacao_identidade: NÃO EXISTE';
    RAISE NOTICE '  → Execute a migração PRODUCAO_sync_confirmacao_identidade.sql';
  END IF;
END $$;

\echo ''

-- ============================================================================
-- SEÇÃO 4: ESTRUTURA DA TABELA (se existir)
-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo '4. ESTRUTURA DA TABELA (se existir)'
\echo '──────────────────────────────────────────────────────────────────'

SELECT 
  column_name as coluna,
  data_type as tipo,
  CASE 
    WHEN is_nullable = 'NO' THEN 'NOT NULL'
    ELSE 'NULLABLE'
  END as nulidade,
  column_default as padrao
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'confirmacao_identidade'
ORDER BY ordinal_position;

\echo ''

-- ============================================================================
-- SEÇÃO 5: CONSTRAINTS (se existir)
-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo '5. CONSTRAINTS (se existir)'
\echo '──────────────────────────────────────────────────────────────────'

SELECT 
  con.conname as nome_constraint,
  CASE con.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'c' THEN 'CHECK'
    WHEN 'u' THEN 'UNIQUE'
    ELSE con.contype::text
  END as tipo,
  pg_get_constraintdef(con.oid) as definicao
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'confirmacao_identidade'
AND nsp.nspname = 'public'
ORDER BY con.contype, con.conname;

\echo ''

-- ============================================================================
-- SEÇÃO 6: ÍNDICES (se existir)
-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo '6. ÍNDICES (se existir)'
\echo '──────────────────────────────────────────────────────────────────'

SELECT 
  indexname as nome_indice,
  indexdef as definicao
FROM pg_indexes
WHERE tablename = 'confirmacao_identidade'
AND schemaname = 'public'
ORDER BY indexname;

\echo ''

-- ============================================================================
-- SEÇÃO 7: POLÍTICAS RLS (se existir)
-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo '7. POLÍTICAS RLS (se existir)'
\echo '──────────────────────────────────────────────────────────────────'

SELECT 
  policyname as politica,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
    ELSE cmd::text
  END as comando,
  roles::text as roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || pg_get_expr(qual, 'confirmacao_identidade'::regclass)
    ELSE 'N/A'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || pg_get_expr(with_check, 'confirmacao_identidade'::regclass)
    ELSE 'N/A'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'confirmacao_identidade'
ORDER BY policyname;

\echo ''

-- ============================================================================
-- SEÇÃO 8: ROLES DISPONÍVEIS
-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo '8. ROLES NECESSÁRIAS (devem existir)'
\echo '──────────────────────────────────────────────────────────────────'

SELECT 
  r.rolname as role,
  CASE 
    WHEN r.rolname IS NOT NULL THEN '✓ EXISTE'
    ELSE '✗ NÃO EXISTE'
  END as status,
  r.rolcanlogin as pode_login
FROM (VALUES 
  ('funcionario_role'),
  ('rh_role'),
  ('gestor_entidade_role'),
  ('admin_role'),
  ('emissor_role')
) AS expected(rolname)
LEFT JOIN pg_roles r ON r.rolname = expected.rolname
ORDER BY expected.rolname;

\echo ''

-- ============================================================================
-- SEÇÃO 9: VERIFICAÇÃO DE INTEGRIDADE
-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo '9. VERIFICAÇÃO DE INTEGRIDADE (se tabela existir)'
\echo '──────────────────────────────────────────────────────────────────'

DO $$ 
DECLARE
  v_existe BOOLEAN;
  v_total INTEGER;
  v_sem_avaliacao INTEGER;
  v_com_avaliacao INTEGER;
  v_cpf_invalidos INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'confirmacao_identidade'
  ) INTO v_existe;
  
  IF v_existe THEN
    -- Total de registros
    EXECUTE 'SELECT COUNT(*) FROM confirmacao_identidade' INTO v_total;
    RAISE NOTICE 'Total de confirmações: %', v_total;
    
    -- Confirmações sem avaliação
    EXECUTE 'SELECT COUNT(*) FROM confirmacao_identidade WHERE avaliacao_id IS NULL' INTO v_sem_avaliacao;
    RAISE NOTICE 'Confirmações sem avaliação (login): %', v_sem_avaliacao;
    
    -- Confirmações com avaliação
    EXECUTE 'SELECT COUNT(*) FROM confirmacao_identidade WHERE avaliacao_id IS NOT NULL' INTO v_com_avaliacao;
    RAISE NOTICE 'Confirmações com avaliação: %', v_com_avaliacao;
    
    -- Verifica CPFs inválidos
    EXECUTE 'SELECT COUNT(*) FROM confirmacao_identidade WHERE cpf_confirmado != funcionario_cpf' INTO v_cpf_invalidos;
    
    IF v_cpf_invalidos > 0 THEN
      RAISE WARNING '✗ Encontrados % registros com CPF confirmado diferente do funcionário!', v_cpf_invalidos;
    ELSE
      RAISE NOTICE '✓ Todos os CPFs estão consistentes';
    END IF;
    
  ELSE
    RAISE NOTICE 'Tabela não existe - verificação de integridade pulada';
  END IF;
END $$;

\echo ''

-- ============================================================================
-- SEÇÃO 10: RESUMO FINAL
-- ============================================================================

\echo ''
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║  RESUMO DA VERIFICAÇÃO                                         ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''

DO $$ 
DECLARE
  v_existe BOOLEAN;
  v_status TEXT;
BEGIN
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'confirmacao_identidade'
  ) INTO v_existe;
  
  IF v_existe THEN
    v_status := '✓ BANCO SINCRONIZADO - Tabela confirmacao_identidade criada';
  ELSE
    v_status := '✗ BANCO PENDENTE - Execute a migração PRODUCAO_sync_confirmacao_identidade.sql';
  END IF;
  
  RAISE NOTICE '%', v_status;
  RAISE NOTICE '';
  RAISE NOTICE 'Data/Hora: %', now();
  RAISE NOTICE 'Banco: %', current_database();
  RAISE NOTICE 'Usuário: %', current_user;
END $$;

\echo ''
\echo '════════════════════════════════════════════════════════════════'
\echo 'FIM DA VERIFICAÇÃO'
\echo '════════════════════════════════════════════════════════════════'
\echo ''
