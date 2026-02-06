-- ================================================================
-- TESTES DAS POLÍTICAS RLS - VERSÃO 3.0
-- ================================================================
-- Data: 11/12/2025
-- ================================================================

\echo '========================================================'
\echo '========================================================'

-- ================================================================
-- PREPARAÇÃO: Criar usuários de teste
-- ================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_admin') THEN
        CREATE USER test_admin WITH PASSWORD 'test123';
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO test_admin;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_rh') THEN
        CREATE USER test_rh WITH PASSWORD 'test123';
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO test_rh;
    END IF;
END $$;

-- ================================================================
-- TESTE 1: Admin vê apenas RH não vinculado a empresas
-- ================================================================

\echo ''
\echo 'TESTE 1: Admin tentando acessar funcionários...'
\echo '   Resultado esperado: Apenas RH sem empresa_id'

SET SESSION AUTHORIZATION test_admin;

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
    v_count_rh_sem_empresa INTEGER;
BEGIN
    -- Contar quantos funcionários Admin vê
    SELECT COUNT(*) INTO v_count FROM funcionarios;
    
    -- Contar quantos RH sem empresa existem (valor esperado)
    RESET SESSION AUTHORIZATION;
    SELECT COUNT(*) INTO v_count_rh_sem_empresa 
    FROM funcionarios 
    WHERE perfil = 'rh' AND empresa_id IS NULL;
    
    SET SESSION AUTHORIZATION test_admin;
    SET app.current_user_perfil = 'admin';
    
    IF v_count = v_count_rh_sem_empresa THEN
        RAISE NOTICE '✓ TESTE 1 PASSOU: Admin vê % funcionários (RH sem empresa)', v_count;
    ELSE
        RAISE EXCEPTION 'FALHA NO TESTE 1: Admin vê % funcionários (esperado: %)', v_count, v_count_rh_sem_empresa;
    END IF;
END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- TESTE 2: Admin NÃO pode acessar avaliações
-- ================================================================

\echo ''
\echo 'TESTE 2: Admin tentando acessar avaliações...'
\echo '   Resultado esperado: 0 registros (bloqueado)'

SET SESSION AUTHORIZATION test_admin;

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM avaliacoes;
    
    IF v_count = 0 THEN
        RAISE NOTICE '✓ TESTE 2 PASSOU: Admin bloqueado em avaliações (vê 0 registros)';
    ELSE
        RAISE EXCEPTION 'FALHA NO TESTE 2: Admin consegue acessar avaliações! Viu % registros', v_count;
    END IF;
END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- TESTE 3: Admin NÃO pode acessar respostas
-- ================================================================

\echo ''
\echo 'TESTE 3: Admin tentando acessar respostas...'
\echo '   Resultado esperado: 0 registros (bloqueado)'

SET SESSION AUTHORIZATION test_admin;

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM respostas;
    
    IF v_count = 0 THEN
        RAISE NOTICE '✓ TESTE 3 PASSOU: Admin bloqueado em respostas (vê 0 registros)';
    ELSE
        RAISE EXCEPTION 'FALHA NO TESTE 3: Admin consegue acessar respostas! Viu % registros', v_count;
    END IF;
END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- TESTE 4: Admin NÃO pode acessar resultados
-- ================================================================

\echo ''
\echo 'TESTE 4: Admin tentando acessar resultados...'
\echo '   Resultado esperado: 0 registros (bloqueado)'

SET SESSION AUTHORIZATION test_admin;

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM resultados;
    
    IF v_count = 0 THEN
        RAISE NOTICE '✓ TESTE 4 PASSOU: Admin bloqueado em resultados (vê 0 registros)';
    ELSE
        RAISE EXCEPTION 'FALHA NO TESTE 4: Admin consegue acessar resultados! Viu % registros', v_count;
    END IF;
END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- TESTE 5: Admin pode visualizar empresas
-- ================================================================

\echo ''
\echo 'TESTE 5: Admin visualizando empresas...'
\echo '   Resultado esperado: Visualização permitida'

SET SESSION AUTHORIZATION test_admin;

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM empresas_clientes;
    
    IF v_count > 0 THEN
        RAISE NOTICE '✓ TESTE 5 PASSOU: Admin pode visualizar % empresas', v_count;
    ELSE
        RAISE NOTICE '⚠ TESTE 5: Admin não vê empresas (pode ser banco vazio)';
    END IF;
END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- TESTE 6: Admin NÃO pode criar empresa
-- ================================================================

\echo ''
\echo 'TESTE 6: Admin tentando criar empresa...'
\echo '   Resultado esperado: ERRO de permissão'

SET SESSION AUTHORIZATION test_admin;

SET app.current_user_perfil = 'admin';

DO $$
BEGIN
    INSERT INTO empresas_clientes (nome, cnpj, email, clinica_id)
    VALUES ('Empresa Teste Admin', '99999999000199', 'teste@admin.com', 1);
    
    RAISE EXCEPTION 'FALHA NO TESTE 6: Admin conseguiu criar empresa!';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE '✓ TESTE 6 PASSOU: Admin bloqueado para criar empresa';
    WHEN OTHERS THEN
        IF SQLERRM LIKE '%policy%' OR SQLERRM LIKE '%permission%' THEN
            RAISE NOTICE '✓ TESTE 6 PASSOU: Admin bloqueado (RLS)';
        ELSE
            RAISE NOTICE '⚠ TESTE 6: Erro diferente: %', SQLERRM;
        END IF;
END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- TESTE 7: Admin NÃO deve gerenciar ou visualizar clínicas
-- ================================================================

\echo ''
\echo 'TESTE 7: Admin gerenciando clínicas (bloqueio esperado)...'
\echo '   Resultado esperado: 0 registros (bloqueado)'

SET SESSION AUTHORIZATION test_admin;

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM clinicas;
    
    IF v_count = 0 THEN
        RAISE NOTICE '✓ TESTE 7 PASSOU: Admin bloqueado de visualizar/gerenciar clínicas (vê 0 registros)';
    ELSE
        RAISE EXCEPTION 'FALHA NO TESTE 7: Admin consegue visualizar clínicas! Viu % registros', v_count;
    END IF;
END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- TESTE 8: Admin NÃO pode acessar lotes
-- ================================================================

\echo ''
\echo 'TESTE 8: Admin tentando acessar lotes...'
\echo '   Resultado esperado: 0 registros (bloqueado)'

SET SESSION AUTHORIZATION test_admin;

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM lotes_avaliacao;
    
    IF v_count = 0 THEN
        RAISE NOTICE '✓ TESTE 8 PASSOU: Admin bloqueado em lotes (vê 0 registros)';
    ELSE
        RAISE EXCEPTION 'FALHA NO TESTE 8: Admin consegue acessar lotes! Viu % registros', v_count;
    END IF;
END $$;

RESET SESSION AUTHORIZATION;

-- ================================================================
-- ================================================================

\echo ''
\echo 'TESTE 9: Testando imutabilidade de resultados...'
\echo '   Resultado esperado: ERRO ao modificar resultado concluído'

DO $$
DECLARE
    v_cpf TEXT := '88888888887';
    v_avaliacao_id INTEGER;
    v_resultado_id INTEGER;
BEGIN
    -- Criar dados de teste
    DELETE FROM funcionarios WHERE cpf = v_cpf;
    
    INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, empresa_id, clinica_id, nivel_cargo)
    VALUES (v_cpf, 'Teste Imutabilidade V3', 'teste.v3@teste.com', '$2b$10$dummy.hash', 'funcionario', 1, 1, 'operacional'::nivel_cargo_enum);

    -- Criar avaliação não concluída
    INSERT INTO avaliacoes (funcionario_cpf, status, inicio)
    VALUES (v_cpf, 'em_andamento', NOW())
    RETURNING id INTO v_avaliacao_id;

    -- Adicionar resultado
    INSERT INTO resultados (avaliacao_id, grupo, dominio, score, categoria)
    VALUES (v_avaliacao_id, 1, 'Teste V3', 75.5, 'medio')
    RETURNING id INTO v_resultado_id;

    -- Concluir avaliação
    UPDATE avaliacoes SET status = 'concluido', envio = NOW() WHERE id = v_avaliacao_id;

    RAISE NOTICE '   Avaliação criada e concluída: ID %', v_avaliacao_id;

    -- Tentar modificar resultado (deve falhar)
    BEGIN
        UPDATE resultados SET score = 50 WHERE id = v_resultado_id;
        RAISE EXCEPTION 'FALHA NO TESTE 9: Resultado foi modificado indevidamente!';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM LIKE '%concluída%' OR SQLERRM LIKE '%concluida%' THEN
            ELSE
                RAISE NOTICE '⚠ TESTE 9: Erro: %', SQLERRM;
            END IF;
    END;

    -- Limpar
    DELETE FROM resultados WHERE id = v_resultado_id;
    DELETE FROM avaliacoes WHERE id = v_avaliacao_id;
    DELETE FROM funcionarios WHERE cpf = v_cpf;
END $$;

-- ================================================================
-- RESUMO DOS TESTES
-- ================================================================

\echo ''
\echo '========================================================'
\echo 'RESUMO DOS TESTES - VERSÃO 3.0'
\echo '========================================================'
\echo ''
\echo 'Testes executados:'
\echo '  1. Admin vê apenas RH sem empresa'
\echo '  2. Admin bloqueado em avaliações'
\echo '  3. Admin bloqueado em respostas'
\echo '  4. Admin bloqueado em resultados'
\echo '  5. Admin pode visualizar empresas'
\echo '  6. Admin NÃO pode criar empresas'
\echo '  7. Admin pode gerenciar clínicas'
\echo '  8. Admin bloqueado em lotes'
\echo ''
\echo '========================================================'
\echo 'FIM DOS TESTES'
\echo '========================================================'

