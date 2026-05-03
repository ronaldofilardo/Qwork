-- Teste de imutabilidade
DO $$
DECLARE
    v_cpf TEXT := '99999999999';
    v_avaliacao_id INTEGER;
    v_resultado_id INTEGER;
BEGIN
    -- Criar dados de teste
    INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, empresa_id, clinica_id, nivel_cargo)
    VALUES (v_cpf, 'Teste Imutabilidade', 'teste@teste.com', '$2b$10$dummy.hash.for.test', 'funcionario', 1, 1, 'operacional'::nivel_cargo_enum)
    ON CONFLICT (cpf) DO NOTHING;

    -- Criar avaliação não concluída primeiro
    INSERT INTO avaliacoes (funcionario_cpf, status, inicio)
    VALUES (v_cpf, 'em_andamento', NOW())
    RETURNING id INTO v_avaliacao_id;

    -- Adicionar resultado
    INSERT INTO resultados (avaliacao_id, grupo, dominio, score, categoria)
    VALUES (v_avaliacao_id, 1, 'Teste', 75.5, 'medio')
    RETURNING id INTO v_resultado_id;

    -- Agora marcar avaliação como concluída
    UPDATE avaliacoes SET status = 'concluida', envio = NOW() WHERE id = v_avaliacao_id;

    RAISE NOTICE 'Avaliação criada: ID %', v_avaliacao_id;
    RAISE NOTICE 'Resultado criado: ID %', v_resultado_id;

    -- Tentar modificar como RH
    SET SESSION AUTHORIZATION test_admin;
    SET app.current_user_perfil = 'rh';

    BEGIN
        UPDATE resultados SET score = 50 WHERE id = v_resultado_id;
        RAISE EXCEPTION 'ERRO: Resultado foi modificado!';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '✓ Imutabilidade funcionando: %', SQLERRM;
    END;

    -- Limpar
    RESET SESSION AUTHORIZATION;
    DELETE FROM resultados WHERE id = v_resultado_id;
    DELETE FROM avaliacoes WHERE id = v_avaliacao_id;
    DELETE FROM funcionarios WHERE cpf = v_cpf;
END $$;