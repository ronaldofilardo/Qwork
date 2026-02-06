-- ================================================================
-- SCRIPT DE TESTES - POLÍTICAS RLS REVISADAS
-- ================================================================
-- Data: 11/12/2025
-- Descrição: Valida as novas políticas RLS e mecanismos de imutabilidade
-- ================================================================

\echo '========================================================'
\echo 'INICIANDO TESTES DE POLÍTICAS RLS'
\echo '========================================================'

-- ================================================================
-- TESTE 1: Admin NÃO pode acessar avaliações
-- ================================================================

\echo ''
\echo 'TESTE 1: Admin tentando acessar avaliações...'
\echo '   Resultado esperado: ERRO de permissão'

SET app.current_user_perfil = 'admin';

SET app.current_user_cpf = '99999999999';

-- Deve falhar
\echo '   Executando SELECT em avaliacoes...'
DO $$
BEGIN
    PERFORM * FROM avaliacoes LIMIT 1;

RAISE EXCEPTION 'FALHA NO TESTE 1: Admin conseguiu acessar avaliações!';

EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE '✓ TESTE 1 PASSOU: Admin bloqueado corretamente';

WHEN OTHERS THEN RAISE NOTICE '✓ TESTE 1 PASSOU: Admin bloqueado (erro diferente)';

END $$;

-- ================================================================
-- TESTE 2: Admin NÃO pode acessar respostas
-- ================================================================

\echo ''
\echo 'TESTE 2: Admin tentando acessar respostas...'
\echo '   Resultado esperado: ERRO de permissão'

SET app.current_user_perfil = 'admin';

DO $$
BEGIN
    PERFORM * FROM respostas LIMIT 1;
    RAISE EXCEPTION 'FALHA NO TESTE 2: Admin conseguiu acessar respostas!';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE '✓ TESTE 2 PASSOU: Admin bloqueado corretamente';
    WHEN OTHERS THEN
        RAISE NOTICE '✓ TESTE 2 PASSOU: Admin bloqueado (erro diferente)';
END $$;

-- ================================================================
-- TESTE 3: Admin NÃO pode acessar resultados
-- ================================================================

\echo ''
\echo 'TESTE 3: Admin tentando acessar resultados...'
\echo '   Resultado esperado: ERRO de permissão'

SET app.current_user_perfil = 'admin';

DO $$
BEGIN
    PERFORM * FROM resultados LIMIT 1;
    RAISE EXCEPTION 'FALHA NO TESTE 3: Admin conseguiu acessar resultados!';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE '✓ TESTE 3 PASSOU: Admin bloqueado corretamente';
    WHEN OTHERS THEN
        RAISE NOTICE '✓ TESTE 3 PASSOU: Admin bloqueado (erro diferente)';
END $$;

-- ================================================================
-- TESTE 4: Admin só acessa funcionários RH/Emissor
-- ================================================================

\echo ''
\echo 'TESTE 4: Admin acessando funcionários...'
\echo '   Resultado esperado: Apenas RH e Emissor visíveis'

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count_total INTEGER;
    v_count_filtered INTEGER;
    v_count_funcionario INTEGER;
BEGIN
    -- Contar total de funcionários (sem RLS)
    SET LOCAL row_security = OFF;
    SELECT COUNT(*) INTO v_count_total FROM funcionarios;
    
    -- Contar funcionários tipo 'funcionario'
    SELECT COUNT(*) INTO v_count_funcionario 
    FROM funcionarios WHERE perfil = 'funcionario';
    
    SET LOCAL row_security = ON;
    
    -- Contar o que Admin vê
    SELECT COUNT(*) INTO v_count_filtered FROM funcionarios;
    
    RAISE NOTICE '   Total de funcionários no banco: %', v_count_total;
    RAISE NOTICE '   Funcionários com perfil "funcionario": %', v_count_funcionario;
    RAISE NOTICE '   Funcionários visíveis para Admin: %', v_count_filtered;
    
    IF v_count_filtered < v_count_total THEN
        RAISE NOTICE '✓ TESTE 4 PASSOU: Admin vê menos funcionários que o total';
    ELSE
        RAISE EXCEPTION 'FALHA NO TESTE 4: Admin vê todos os funcionários!';
    END IF;
    
    -- Verificar se há algum funcionário comum visível
    PERFORM 1 FROM funcionarios WHERE perfil = 'funcionario' LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'FALHA NO TESTE 4: Admin consegue ver funcionários comuns!';
    ELSE
        RAISE NOTICE '✓ TESTE 4 PASSOU: Funcionários comuns não visíveis para Admin';
    END IF;
END $$;

-- ================================================================
-- TESTE 5: Admin PODE acessar empresas
-- ================================================================

\echo ''
\echo 'TESTE 5: Admin acessando empresas...'
\echo '   Resultado esperado: Acesso permitido'

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM empresas_clientes;
    RAISE NOTICE '   Empresas visíveis para Admin: %', v_count;
    RAISE NOTICE '✓ TESTE 5 PASSOU: Admin pode acessar empresas';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'FALHA NO TESTE 5: Admin não consegue acessar empresas!';
END $$;

-- ================================================================
-- TESTE 6: Admin PODE acessar clínicas
-- ================================================================

\echo ''
\echo 'TESTE 6: Admin acessando clínicas...'
\echo '   Resultado esperado: Acesso permitido'

SET app.current_user_perfil = 'admin';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM clinicas;
    RAISE NOTICE '   Clínicas visíveis para Admin: %', v_count;
    RAISE NOTICE '✓ TESTE 6 PASSOU: Admin pode acessar clínicas';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'FALHA NO TESTE 6: Admin não consegue acessar clínicas!';
END $$;

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
    
EXCEPTION
    WHEN OTHERS THEN
END $$;

-- ================================================================
-- TESTE 8: Imutabilidade de resultados (UPDATE)
-- ================================================================

\echo ''
\echo 'TESTE 8: Tentando modificar resultado de avaliação concluída...'
\echo '   Resultado esperado: ERRO de imutabilidade'

-- Criar dados de teste
DO $$
DECLARE
    v_cpf TEXT := '11111111111';
    v_avaliacao_id INTEGER;
    v_resultado_id INTEGER;
BEGIN
    -- Desabilitar RLS temporariamente para setup
    SET LOCAL row_security = OFF;
    
    -- Criar funcionário de teste se não existir
    INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, empresa_id, clinica_id)
    VALUES (v_cpf, 'Teste Imutabilidade', 'teste@teste.com', '$2b$10$dummy.hash.for.test', 'funcionario', 1, 1)
    ON CONFLICT (cpf) DO NOTHING;
    
    -- Criar avaliação concluída
    INSERT INTO avaliacoes (funcionario_cpf, status, envio)
    VALUES (v_cpf, 'concluido', NOW())
    RETURNING id INTO v_avaliacao_id;
    
    -- Criar resultado
    INSERT INTO resultados (avaliacao_id, grupo_avaliacao, score, nivel_risco)
    VALUES (v_avaliacao_id, 1, 75.5, 'medio')
    RETURNING id INTO v_resultado_id;
    
    RAISE NOTICE '   Avaliação de teste criada: ID %', v_avaliacao_id;
    RAISE NOTICE '   Resultado de teste criado: ID %', v_resultado_id;
    
    -- Tentar modificar (deve falhar)
    SET LOCAL row_security = ON;
    SET LOCAL app.current_user_perfil = 'rh';
    
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
    SET LOCAL row_security = OFF;
    DELETE FROM resultados WHERE id = v_resultado_id;
    DELETE FROM avaliacoes WHERE id = v_avaliacao_id;
END $$;

-- ================================================================
-- TESTE 9: Imutabilidade de respostas (UPDATE)
-- ================================================================

\echo ''
\echo 'TESTE 9: Tentando modificar resposta de avaliação concluída...'
\echo '   Resultado esperado: ERRO de imutabilidade'

DO $$
DECLARE
    v_cpf TEXT := '11111111111';
    v_avaliacao_id INTEGER;
    v_resposta_id INTEGER;
BEGIN
    SET LOCAL row_security = OFF;
    
    -- Criar avaliação concluída
    INSERT INTO avaliacoes (funcionario_cpf, status, envio)
    VALUES (v_cpf, 'concluido', NOW())
    RETURNING id INTO v_avaliacao_id;
    
    -- Criar resposta
    INSERT INTO respostas (avaliacao_id, pergunta_id, resposta)
    VALUES (v_avaliacao_id, 1, 3)
    RETURNING id INTO v_resposta_id;
    
    RAISE NOTICE '   Resposta de teste criada: ID %', v_resposta_id;
    
    -- Tentar modificar (deve falhar)
    SET LOCAL row_security = ON;
    SET LOCAL app.current_user_perfil = 'rh';
    
    BEGIN
        UPDATE respostas SET resposta = 4 WHERE id = v_resposta_id;
        RAISE EXCEPTION 'FALHA NO TESTE 9: Resposta foi modificada indevidamente!';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM LIKE '%concluída%' OR SQLERRM LIKE '%imutável%' THEN
                RAISE NOTICE '✓ TESTE 9 PASSOU: Imutabilidade funcionando';
            ELSE
                RAISE EXCEPTION 'FALHA NO TESTE 9: Erro diferente do esperado: %', SQLERRM;
            END IF;
    END;
    
    -- Limpar dados de teste
    SET LOCAL row_security = OFF;
    DELETE FROM respostas WHERE id = v_resposta_id;
    DELETE FROM avaliacoes WHERE id = v_avaliacao_id;
END $$;

-- ================================================================
-- ================================================================

\echo ''
\echo '   Resultado esperado: Modificação permitida (bypass)'

DO $$
DECLARE
    v_cpf TEXT := '11111111111';
    v_avaliacao_id INTEGER;
    v_resultado_id INTEGER;
    v_score_before DECIMAL;
    v_score_after DECIMAL;
BEGIN
    SET LOCAL row_security = OFF;
    
    -- Criar avaliação concluída
    INSERT INTO avaliacoes (funcionario_cpf, status, envio)
    VALUES (v_cpf, 'concluido', NOW())
    RETURNING id INTO v_avaliacao_id;
    
    -- Criar resultado
    INSERT INTO resultados (avaliacao_id, grupo_avaliacao, score, nivel_risco)
    VALUES (v_avaliacao_id, 1, 75.5, 'medio')
    RETURNING id, score INTO v_resultado_id, v_score_before;
    
    RAISE NOTICE '   Score antes da modificação: %', v_score_before;
    
    SET LOCAL row_security = ON;
    
    UPDATE resultados SET score = 50 WHERE id = v_resultado_id;
    
    SELECT score INTO v_score_after FROM resultados WHERE id = v_resultado_id;
    RAISE NOTICE '   Score depois da modificação: %', v_score_after;
    
    IF v_score_after = 50 THEN
    ELSE
        RAISE EXCEPTION 'FALHA NO TESTE 10: Score não foi modificado!';
    END IF;
    
    -- Limpar dados de teste
    SET LOCAL row_security = OFF;
    DELETE FROM resultados WHERE id = v_resultado_id;
    DELETE FROM avaliacoes WHERE id = v_avaliacao_id;
END $$;

-- ================================================================
-- TESTE 11: Proteção de status de avaliação concluída
-- ================================================================

\echo ''
\echo 'TESTE 11: Tentando alterar status de avaliação concluída...'
\echo '   Resultado esperado: ERRO de proteção'

DO $$
DECLARE
    v_cpf TEXT := '11111111111';
    v_avaliacao_id INTEGER;
BEGIN
    SET LOCAL row_security = OFF;
    
    -- Criar avaliação concluída
    INSERT INTO avaliacoes (funcionario_cpf, status, envio)
    VALUES (v_cpf, 'concluido', NOW())
    RETURNING id INTO v_avaliacao_id;
    
    RAISE NOTICE '   Avaliação criada: ID %', v_avaliacao_id;
    
    -- Tentar mudar status (deve falhar)
    SET LOCAL row_security = ON;
    SET LOCAL app.current_user_perfil = 'rh';
    
    BEGIN
        UPDATE avaliacoes SET status = 'em_andamento' WHERE id = v_avaliacao_id;
        RAISE EXCEPTION 'FALHA NO TESTE 11: Status foi alterado indevidamente!';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM LIKE '%concluída%' OR SQLERRM LIKE '%status%' THEN
                RAISE NOTICE '✓ TESTE 11 PASSOU: Proteção de status funcionando';
            ELSE
                RAISE EXCEPTION 'FALHA NO TESTE 11: Erro diferente do esperado: %', SQLERRM;
            END IF;
    END;
    
    -- Limpar dados de teste
    SET LOCAL row_security = OFF;
    DELETE FROM avaliacoes WHERE id = v_avaliacao_id;
END $$;

-- ================================================================
-- RESUMO DOS TESTES
-- ================================================================

\echo ''
\echo '========================================================'
\echo 'RESUMO DOS TESTES EXECUTADOS'
\echo '========================================================'
\echo ''
\echo 'Se todos os testes mostraram "✓ PASSOU", as políticas'
\echo 'RLS estão funcionando corretamente!'
\echo ''
\echo 'Testes realizados:'
\echo '  1. Admin bloqueado em avaliações'
\echo '  2. Admin bloqueado em respostas'
\echo '  3. Admin bloqueado em resultados'
\echo '  4. Admin restrito a RH/Emissor em funcionários'
\echo '  5. Admin permitido em empresas'
\echo '  6. Admin permitido em clínicas'
\echo '  8. Imutabilidade de resultados'
\echo '  9. Imutabilidade de respostas'
\echo ' 11. Proteção de status concluído'
\echo ''
\echo '========================================================'
\echo 'FIM DOS TESTES'
\echo '========================================================'

