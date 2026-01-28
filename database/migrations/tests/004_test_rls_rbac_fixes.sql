-- ==========================================
-- SCRIPT DE TESTES - CORREÇÕES RBAC E RLS
-- ==========================================
-- Data: 2025-12-14
-- Descrição: Valida as correções implementadas no script 004_rls_rbac_fixes.sql
-- ==========================================

\echo '========================================================'
\echo 'TESTES DE VALIDAÇÃO - CORREÇÕES RBAC E RLS'
\echo '========================================================'

-- ==========================================
-- SETUP DE TESTE
-- ==========================================

-- Criar dados de teste se necessário
DO $$
BEGIN
    -- Inserir clínica de teste se não existe
    INSERT INTO clinicas (id, nome, cnpj, ativo)
    VALUES (999, 'Clínica Teste', '12345678000199', true)
    ON CONFLICT (id) DO NOTHING;
    
    -- Inserir empresa de teste
    INSERT INTO empresas_clientes (id, clinica_id, nome, cnpj, ativo)
    VALUES (999, 999, 'Empresa Teste', '98765432000188', true)
    ON CONFLICT (id) DO NOTHING;
    
    -- Inserir funcionário RH de teste
    INSERT INTO funcionarios (cpf, nome, email, senha, perfil, clinica_id, empresa_id, ativo)
    VALUES ('99999999999', 'RH Teste', 'rh@teste.com', '$2b$10$test', 'rh', 999, NULL, true)
    ON CONFLICT (cpf) DO UPDATE SET ativo = true;
    
    -- Inserir funcionário comum de teste
    INSERT INTO funcionarios (cpf, nome, email, senha, perfil, clinica_id, empresa_id, ativo)
    VALUES ('88888888888', 'Funcionário Teste', 'func@teste.com', '$2b$10$test', 'funcionario', 999, 999, true)
    ON CONFLICT (cpf) DO UPDATE SET ativo = true;
    
    -- Inserir emissor de teste
    INSERT INTO funcionarios (cpf, nome, email, senha, perfil, clinica_id, empresa_id, ativo)
    VALUES ('77777777777', 'Emissor Teste', 'emissor@teste.com', '$2b$10$test', 'emissor', NULL, NULL, true)
    ON CONFLICT (cpf) DO UPDATE SET ativo = true;
    
    -- Inserir admin de teste
    INSERT INTO funcionarios (cpf, nome, email, senha, perfil, clinica_id, empresa_id, ativo)
    VALUES ('66666666666', 'Admin Teste', 'admin@teste.com', '$2b$10$test', 'admin', NULL, NULL, true)
    ON CONFLICT (cpf) DO UPDATE SET ativo = true;
END $$;

-- ==========================================
-- TESTE 1: Políticas RLS para audit_logs
-- ==========================================

\echo ''
\echo 'TESTE 1: Políticas RLS para audit_logs'
\echo '----------------------------------------'

-- Inserir log de teste
INSERT INTO
    audit_logs (
        user_cpf,
        user_perfil,
        action,
        resource,
        details
    )
VALUES (
        '99999999999',
        'rh',
        'TEST',
        'test_table',
        'Log de teste'
    );

-- Teste 1.1: Admin vê todos os logs
\echo '  1.1: Admin deve ver todos os logs'
SET LOCAL app.current_user_cpf = '66666666666';

SET LOCAL app.current_user_perfil = 'admin';

SELECT
    CASE
        WHEN COUNT(*) > 0 THEN '    ✓ PASSOU: Admin vê logs'
        ELSE '    ✗ FALHOU: Admin não vê logs'
    END as resultado
FROM audit_logs;

-- Teste 1.2: RH vê apenas próprios logs
\echo '  1.2: RH deve ver apenas próprios logs'
SET LOCAL app.current_user_cpf = '99999999999';

SET LOCAL app.current_user_perfil = 'rh';

SELECT
    CASE
        WHEN COUNT(*) > 0
        AND NOT EXISTS (
            SELECT 1
            FROM audit_logs
            WHERE
                user_cpf != '99999999999'
        ) THEN '    ✓ PASSOU: RH vê apenas próprios logs'
        ELSE '    ✗ FALHOU: RH vê logs de outros usuários'
    END as resultado
FROM audit_logs
WHERE
    user_cpf = '99999999999';

-- ==========================================
-- TESTE 2: Integração RBAC com RLS
-- ==========================================

\echo ''
\echo 'TESTE 2: Integração RBAC com RLS'
\echo '----------------------------------------'

-- Teste 2.1: Função user_has_permission
\echo '  2.1: Verificar função user_has_permission'
SET LOCAL app.current_user_perfil = 'admin';

SELECT
    CASE
        WHEN user_has_permission ('manage:clinicas') THEN '    ✓ PASSOU: Admin tem permissão manage:clinicas'
        ELSE '    ✗ FALHOU: Admin não tem permissão manage:clinicas'
    END as resultado;

-- ==========================================
-- TESTE 3: Validação de Pertencimento RH
-- ==========================================

\echo ''
\echo 'TESTE 3: Validação de Pertencimento RH'
\echo '----------------------------------------'

-- Teste 3.1: RH válido
\echo '  3.1: RH válido deve passar validação'
SET LOCAL app.current_user_cpf = '99999999999';

SET LOCAL app.current_user_perfil = 'rh';

SET LOCAL app.current_user_clinica_id = '999';

SELECT
    CASE
        WHEN validate_rh_clinica () THEN '    ✓ PASSOU: RH válido'
        ELSE '    ✗ FALHOU: RH válido não passou validação'
    END as resultado;

-- Teste 3.2: RH com clínica errada deve falhar
\echo '  3.2: RH com clínica errada deve falhar validação'
SET LOCAL app.current_user_cpf = '99999999999';

SET LOCAL app.current_user_perfil = 'rh';

SET LOCAL app.current_user_clinica_id = '888';

SELECT
    CASE
        WHEN NOT validate_rh_clinica () THEN '    ✓ PASSOU: RH inválido bloqueado'
        ELSE '    ✗ FALHOU: RH inválido passou validação'
    END as resultado;

-- ==========================================
-- TESTE 4: Imutabilidade de Laudos
-- ==========================================

\echo ''
\echo 'TESTE 4: Imutabilidade de Laudos'
\echo '----------------------------------------'

-- Criar laudo de teste
DO $$
BEGIN
    -- Inserir lote de teste
    INSERT INTO lotes_avaliacao (id, clinica_id, empresa_id, nome, status)
    VALUES (999, 999, 999, 'Lote Teste', 'concluido')
    ON CONFLICT (id) DO NOTHING;
    
    -- Inserir laudo emitido
    INSERT INTO laudos (id, lote_id, titulo, emissor_cpf, emitido_em, status)
    VALUES (999, 999, 'Laudo Teste', '77777777777', NOW(), 'emitido')
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Teste 4.1: Tentar modificar laudo emitido
\echo '  4.1: Modificação de laudo emitido deve falhar'
DO $$
BEGIN
    UPDATE laudos SET titulo = 'Modificado' WHERE id = 999;

RAISE EXCEPTION ' ✗ FALHOU: Laudo emitido foi modificado';

EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE '%imutáveis%'
OR SQLERRM LIKE '%emitidos%' THEN RAISE NOTICE '    ✓ PASSOU: Laudo emitido protegido';

ELSE RAISE NOTICE '    ✗ FALHOU: Erro diferente do esperado: %',
SQLERRM;

END IF;

END $$;

-- ==========================================
-- TESTE 5: Políticas Granulares por Operação
-- ==========================================

\echo ''
\echo 'TESTE 5: Políticas Granulares por Operação'
\echo '----------------------------------------'

-- Teste 5.1: Funcionário pode ler próprios dados
\echo '  5.1: Funcionário pode ler próprios dados'
SET LOCAL app.current_user_cpf = '88888888888';

SET LOCAL app.current_user_perfil = 'funcionario';

SELECT
    CASE
        WHEN COUNT(*) = 1 THEN '    ✓ PASSOU: Funcionário lê próprios dados'
        ELSE '    ✗ FALHOU: Funcionário não lê próprios dados'
    END as resultado
FROM funcionarios
WHERE
    cpf = '88888888888';

-- Teste 5.2: Funcionário não pode ler dados de outros
\echo '  5.2: Funcionário não pode ler dados de outros'
SELECT CASE 
    WHEN COUNT(*) = 0 THEN '    ✓ PASSOU: Funcionário não vê outros'
    ELSE '    ✗ FALHOU: Funcionário vê dados de outros'
END as resultado
FROM funcionarios WHERE cpf != '88888888888';

-- Teste 5.3: RH pode ler funcionários da sua clínica
\echo '  5.3: RH pode ler funcionários da sua clínica'
SET LOCAL app.current_user_cpf = '99999999999';

SET LOCAL app.current_user_perfil = 'rh';

SET LOCAL app.current_user_clinica_id = '999';

SELECT
    CASE
        WHEN COUNT(*) >= 1 THEN '    ✓ PASSOU: RH vê funcionários da clínica'
        ELSE '    ✗ FALHOU: RH não vê funcionários da clínica'
    END as resultado
FROM funcionarios
WHERE
    clinica_id = 999;

-- ==========================================
-- TESTE 6: Admin com Acesso Restrito
-- ==========================================

\echo ''
\echo 'TESTE 6: Admin com Acesso Restrito'
\echo '----------------------------------------'

-- Teste 6.1: Admin pode ver empresas
\echo '  6.1: Admin pode ver empresas'
SET LOCAL app.current_user_cpf = '66666666666';

SET LOCAL app.current_user_perfil = 'admin';

SELECT
    CASE
        WHEN COUNT(*) > 0 THEN '    ✓ PASSOU: Admin vê empresas'
        ELSE '    ✗ FALHOU: Admin não vê empresas'
    END as resultado
FROM empresas_clientes;

-- Teste 6.2: Admin pode ver clínicas
\echo '  6.2: Admin pode ver clínicas'
SELECT CASE 
    WHEN COUNT(*) > 0 THEN '    ✓ PASSOU: Admin vê clínicas'
    ELSE '    ✗ FALHOU: Admin não vê clínicas'
END as resultado
FROM clinicas;

-- Teste 6.3: Admin vê apenas funcionários RH/Emissor
\echo '  6.3: Admin vê apenas funcionários RH/Emissor'
SELECT CASE 
    WHEN COUNT(*) > 0 AND NOT EXISTS (
        SELECT 1 FROM funcionarios WHERE perfil = 'funcionario'
    ) THEN '    ✓ PASSOU: Admin vê apenas RH/Emissor'
    ELSE '    ✗ FALHOU: Admin vê funcionários comuns'
END as resultado
FROM funcionarios WHERE perfil IN ('rh', 'emissor', 'admin');

-- ==========================================
-- TESTE 7: RLS para Tabelas de Sistema
-- ==========================================

\echo ''
\echo 'TESTE 7: RLS para Tabelas de Sistema'
\echo '----------------------------------------'

-- Teste 7.1: Admin pode ver roles
\echo '  7.1: Admin pode ver roles'
SET LOCAL app.current_user_cpf = '66666666666';

SET LOCAL app.current_user_perfil = 'admin';

SELECT
    CASE
        WHEN COUNT(*) > 0 THEN '    ✓ PASSOU: Admin vê roles'
        ELSE '    ✗ FALHOU: Admin não vê roles'
    END as resultado
FROM roles;

-- Teste 7.2: RH não pode ver roles
\echo '  7.2: RH não pode ver roles'
SET LOCAL app.current_user_cpf = '99999999999';

SET LOCAL app.current_user_perfil = 'rh';

SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '    ✓ PASSOU: RH não vê roles'
        ELSE '    ✗ FALHOU: RH vê roles'
    END as resultado
FROM roles;

-- ==========================================
-- TESTE 8: Constraints de Integridade
-- ==========================================

\echo ''
\echo 'TESTE 8: Constraints de Integridade'
\echo '----------------------------------------'

-- Teste 8.1: Não pode criar avaliação para funcionário inexistente
\echo '  8.1: Avaliação com funcionário inexistente deve falhar'
DO $$
BEGIN
    INSERT INTO avaliacoes (funcionario_cpf, lote_id, status)
    VALUES ('00000000000', 999, 'pendente');

RAISE EXCEPTION ' ✗ FALHOU: Avaliação criada com CPF inválido';

EXCEPTION WHEN foreign_key_violation THEN RAISE NOTICE '    ✓ PASSOU: FK impediu avaliação órfã';

WHEN OTHERS THEN RAISE NOTICE '    ⚠ ATENÇÃO: Erro diferente: %',
SQLERRM;

END $$;

-- ==========================================
-- TESTE 9: Índices de Performance
-- ==========================================

\echo ''
\echo 'TESTE 9: Índices de Performance'
\echo '----------------------------------------'

-- Verificar se índices foram criados
\echo '  9.1: Verificar índices críticos'
SELECT 
    CASE 
        WHEN COUNT(*) >= 10 THEN '    ✓ PASSOU: Índices criados'
        ELSE '    ✗ FALHOU: Índices faltando'
    END as resultado
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
AND tablename IN ('funcionarios', 'avaliacoes', 'empresas_clientes', 'lotes_avaliacao', 'laudos');

-- ==========================================
-- TESTE 10: Status Padronizados
-- ==========================================

\echo ''
\echo 'TESTE 10: Status Padronizados'
\echo '----------------------------------------'

-- Verificar se tipos ENUM foram criados
\echo '  10.1: Verificar tipos ENUM de status'
SELECT 
    CASE 
        WHEN COUNT(*) >= 3 THEN '    ✓ PASSOU: Tipos ENUM criados'
        ELSE '    ✗ FALHOU: Tipos ENUM faltando'
    END as resultado
FROM pg_type 
WHERE typname IN ('status_avaliacao', 'status_lote', 'status_laudo');

-- ==========================================
-- LIMPEZA
-- ==========================================

\echo ''
\echo 'Limpando dados de teste...'
DELETE FROM audit_logs WHERE user_cpf = '99999999999';

-- ==========================================
-- RESUMO
-- ==========================================

\echo ''
\echo '========================================================'
\echo 'TESTES CONCLUÍDOS'
\echo '========================================================'
\echo 'Revise os resultados acima para identificar falhas.'
\echo 'Todos os testes devem mostrar ✓ PASSOU.'
\echo ''
\echo 'Se algum teste falhou:'
\echo '  1. Verifique se o script 004_rls_rbac_fixes.sql foi executado'
\echo '  2. Verifique se há dados órfãos no banco'
\echo '  3. Execute os testes individualmente para debug'
\echo '========================================================'