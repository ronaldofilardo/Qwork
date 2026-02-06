-- ================================================================
-- SCRIPT DE TESTES RLS - VERSÃO CORRIGIDA
-- ================================================================
-- Data: 11/12/2025
-- Descrição: Testes das políticas RLS com usuários não-superusuários
-- ================================================================

\echo '========================================================'
\echo 'INICIANDO TESTES DE POLÍTICAS RLS (VERSÃO CORRIGIDA)'
\echo '========================================================'

-- ================================================================
-- PREPARAÇÃO: Criar usuário de teste
-- ================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_admin') THEN
        CREATE USER test_admin WITH PASSWORD 'test123';
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO test_admin;
    END IF;
    END IF;
END $$;

-- ================================================================
-- TESTE 1: Admin NÃO pode acessar avaliações
-- ================================================================

\echo ''
\echo 'TESTE 1: Admin tentando acessar avaliações...'
\echo '   Resultado esperado: ERRO de permissão'

SET SESSION AUTHORIZATION test_admin;

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM avaliacoes;
    IF v_count = 0 THEN
        RAISE NOTICE '✓ TESTE 1 PASSOU: Admin bloqueado corretamente em avaliações (vê 0 registros)';
    ELSE
        RAISE EXCEPTION 'FALHA NO TESTE 1: Admin consegue acessar avaliações! Viu % registros', v_count;
    END IF;
END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- TESTE 2: Admin NÃO pode acessar respostas
-- ================================================================

\echo ''
\echo 'TESTE 2: Admin tentando acessar respostas...'
\echo '   Resultado esperado: ERRO de permissão'

SET SESSION AUTHORIZATION test_admin;

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM respostas;
    IF v_count = 0 THEN
        RAISE NOTICE '✓ TESTE 2 PASSOU: Admin bloqueado corretamente em respostas (vê 0 registros)';
    ELSE
        RAISE EXCEPTION 'FALHA NO TESTE 2: Admin consegue acessar respostas! Viu % registros', v_count;
    END IF;
END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- TESTE 3: Admin NÃO pode acessar resultados
-- ================================================================

\echo ''
\echo 'TESTE 3: Admin tentando acessar resultados...'
\echo '   Resultado esperado: ERRO de permissão'

SET SESSION AUTHORIZATION test_admin;

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM resultados;
    IF v_count = 0 THEN
        RAISE NOTICE '✓ TESTE 3 PASSOU: Admin bloqueado corretamente em resultados (vê 0 registros)';
    ELSE
        RAISE EXCEPTION 'FALHA NO TESTE 3: Admin consegue acessar resultados! Viu % registros', v_count;
    END IF;
END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- TESTE 4: Admin vê apenas RH/Emissor em funcionários
-- ================================================================

\echo ''
\echo 'TESTE 4: Admin acessando funcionários...'
\echo '   Resultado esperado: Apenas RH e Emissor (4 registros)'

SET SESSION AUTHORIZATION test_admin;

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
    v_expected INTEGER := 4; -- 2 RH + 1 Emissor + 1 Admin = 4
BEGIN
    SELECT COUNT(*) INTO v_count FROM funcionarios;

    IF v_count = v_expected THEN
        RAISE NOTICE '✓ TESTE 4 PASSOU: Admin vê % funcionários (esperado: %)', v_count, v_expected;
    ELSE
        RAISE EXCEPTION 'FALHA NO TESTE 4: Admin vê % funcionários (esperado: %)', v_count, v_expected;
    END IF;
END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- TESTE 5: Admin PODE acessar empresas
-- ================================================================

\echo ''
\echo 'TESTE 5: Admin acessando empresas...'
\echo '   Resultado esperado: Acesso permitido'

SET SESSION AUTHORIZATION test_admin;

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM empresas_clientes;

    IF v_count > 0 THEN
        RAISE NOTICE '✓ TESTE 5 PASSOU: Admin vê % empresas', v_count;
    ELSE
        RAISE EXCEPTION 'FALHA NO TESTE 5: Admin não consegue acessar empresas';
    END IF;
END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- TESTE 6: Admin PODE acessar clínicas
-- ================================================================

\echo ''
\echo 'TESTE 6: Admin acessando clínicas...'
\echo '   Resultado esperado: Acesso permitido'

SET SESSION AUTHORIZATION test_admin;

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM clinicas;

    IF v_count > 0 THEN
        RAISE NOTICE '✓ TESTE 6 PASSOU: Admin vê % clínicas', v_count;
    ELSE
        RAISE EXCEPTION 'FALHA NO TESTE 6: Admin não consegue acessar clínicas';
    END IF;
END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- ================================================================

\echo ''
\echo '   Resultado esperado: Acesso total permitido'



DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM avaliacoes;

    SELECT COUNT(*) INTO v_count FROM respostas;

    SELECT COUNT(*) INTO v_count FROM resultados;

    SELECT COUNT(*) INTO v_count FROM funcionarios;

END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- TESTE 8: Imutabilidade de resultados concluídos
-- ================================================================

\echo ''
\echo 'TESTE 8: Tentando modificar resultado de avaliação concluída...'
\echo '   Resultado esperado: ERRO de imutabilidade'

-- Criar dados de teste como postgres (superusuário)
RESET SESSION AUTHORIZATION;

DO $$
DECLARE
    v_cpf TEXT := '11111111111';
    v_avaliacao_id INTEGER;
    v_resultado_id INTEGER;
BEGIN
    -- Criar funcionário de teste
    INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, empresa_id, clinica_id, nivel_cargo)
    VALUES (v_cpf, 'Teste Imutabilidade', 'teste@teste.com', '$2b$10$dummy.hash.for.test', 'funcionario', 1, 1, 1)
    ON CONFLICT (cpf) DO NOTHING;

    -- Criar avaliação concluída
    INSERT INTO avaliacoes (funcionario_cpf, status, inicio, envio)
    VALUES (v_cpf, 'concluido', NOW(), NOW())
    RETURNING id INTO v_avaliacao_id;

    -- Criar resultado
    INSERT INTO resultados (avaliacao_id, grupo_avaliacao, score, nivel_risco)
    VALUES (v_avaliacao_id, 1, 75.5, 'medio')
    RETURNING id INTO v_resultado_id;

    RAISE NOTICE '   Avaliação de teste criada: ID %', v_avaliacao_id;
    RAISE NOTICE '   Resultado de teste criado: ID %', v_resultado_id;

    -- Tentar modificar como RH (deve falhar)
    SET SESSION AUTHORIZATION test_admin;
    SET app.current_user_perfil = 'rh';

    BEGIN
        UPDATE resultados SET score = 50 WHERE id = v_resultado_id;
        RAISE EXCEPTION 'FALHA NO TESTE 8: Resultado foi modificado indevidamente!';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM LIKE '%concluída%' OR SQLERRM LIKE '%imutável%' THEN
                RAISE NOTICE '✓ TESTE 8 PASSOU: Imutabilidade funcionando';
            ELSE
                RAISE EXCEPTION 'FALHA NO TESTE 8: Erro diferente do esperado: %', SQLERRM;
            END IF;
    END;

    -- Limpar dados de teste
    RESET SESSION AUTHORIZATION;
    DELETE FROM resultados WHERE id = v_resultado_id;
    DELETE FROM avaliacoes WHERE id = v_avaliacao_id;
    DELETE FROM funcionarios WHERE cpf = v_cpf;
END $$;

-- ================================================================
-- RESUMO DOS TESTES
-- ================================================================

\echo ''
\echo '========================================================'
\echo 'RESUMO DOS TESTES EXECUTADOS'
\echo '========================================================'
\echo ''
\echo 'Testes realizados:'
\echo '  1. Admin bloqueado em avaliações'
\echo '  2. Admin bloqueado em respostas'
\echo '  3. Admin bloqueado em resultados'
\echo '  4. Admin restrito a RH/Emissor em funcionários'
\echo '  5. Admin permitido em empresas'
\echo '  6. Admin permitido em clínicas'
\echo '  8. Imutabilidade de resultados concluídos'
\echo ''
\echo '========================================================'
\echo 'FIM DOS TESTES'
\echo '========================================================'

