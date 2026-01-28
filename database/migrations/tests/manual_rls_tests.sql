-- ==========================================
-- TESTES DE ISOLAMENTO RLS - Validação Manual
-- Descrição: Testes SQL para validar Row Level Security
-- Data: 2025-12-10
-- ==========================================
-- Execute cada seção separadamente para validar isolamento
-- ==========================================

-- ==========================================
-- PREPARAÇÃO: Criar usuários de teste (se não existirem)
-- ==========================================

-- Verificar funcionários existentes para testes
SELECT
    cpf,
    nome,
    perfil,
    clinica_id,
    empresa_id
FROM funcionarios
WHERE
    perfil IN (
        'funcionario',
        'rh',
        'emissor',
        'admin',
    )
LIMIT 10;

-- ==========================================
-- TESTE 1: ISOLAMENTO FUNCIONÁRIO
-- ==========================================

-- 1.1 Simular sessão de funcionário
SET app.current_user_cpf = '22222222222';
-- Ajustar para CPF real do seu banco
SET app.current_user_perfil = 'funcionario';

-- 1.2 Funcionário deve ver APENAS seus próprios dados
SELECT COUNT(*) as meus_dados
FROM funcionarios
WHERE
    cpf = current_user_cpf ();
-- ESPERADO: 1

-- 1.3 Funcionário NÃO deve ver dados de outros
SELECT COUNT(*) as dados_outros
FROM funcionarios
WHERE
    cpf != current_user_cpf ();
-- ESPERADO: 0

-- 1.4 Funcionário vê apenas suas avaliações
SELECT COUNT(*) as minhas_avaliacoes
FROM avaliacoes
WHERE
    funcionario_cpf = current_user_cpf ();
-- ESPERADO: >= 0 (depende dos dados)

-- 1.5 Funcionário NÃO vê avaliações de outros
SELECT COUNT(*) as avaliacoes_outros
FROM avaliacoes
WHERE
    funcionario_cpf != current_user_cpf ();
-- ESPERADO: 0

-- 1.6 Funcionário vê apenas suas respostas
SELECT COUNT(*) as minhas_respostas
FROM respostas r
    JOIN avaliacoes a ON a.id = r.avaliacao_id
WHERE
    a.funcionario_cpf = current_user_cpf ();
-- ESPERADO: >= 0

-- 1.7 Funcionário vê apenas seus resultados
SELECT COUNT(*) as meus_resultados
FROM resultados res
    JOIN avaliacoes a ON a.id = res.avaliacao_id
WHERE
    a.funcionario_cpf = current_user_cpf ();
-- ESPERADO: >= 0

-- 1.8 Tentar ver empresas (deve falhar ou retornar vazio)
SELECT COUNT(*) as empresas_visiveis FROM empresas_clientes;
-- ESPERADO: 0 (funcionário não tem policy para ver empresas)

-- RESET das variáveis
RESET app.current_user_cpf;

RESET app.current_user_perfil;

RESET app.current_user_clinica_id;

-- ==========================================
-- TESTE 2: ISOLAMENTO RH/CLÍNICA
-- ==========================================

-- 2.1 Simular sessão de RH (ajustar CPF e clinica_id reais)
SET app.current_user_cpf = '11111111111';

SET app.current_user_perfil = 'rh';

SET app.current_user_clinica_id = '1';

-- 2.2 RH vê apenas funcionários de sua clínica
SELECT COUNT(*) as func_minha_clinica
FROM funcionarios
WHERE
    clinica_id = current_user_clinica_id ();
-- ESPERADO: >= 1

-- 2.3 RH NÃO vê funcionários de outras clínicas
SELECT COUNT(*) as func_outras_clinicas
FROM funcionarios
WHERE
    clinica_id != current_user_clinica_id ()
    OR clinica_id IS NULL;
-- ESPERADO: 0

-- 2.4 RH vê apenas empresas de sua clínica
SELECT COUNT(*) as empresas_minha_clinica
FROM empresas_clientes
WHERE
    clinica_id = current_user_clinica_id ();
-- ESPERADO: >= 0

-- 2.5 RH NÃO vê empresas de outras clínicas
SELECT COUNT(*) as empresas_outras_clinicas
FROM empresas_clientes
WHERE
    clinica_id != current_user_clinica_id ();
-- ESPERADO: 0

-- 2.6 RH vê apenas lotes de sua clínica
SELECT COUNT(*) as lotes_minha_clinica
FROM lotes_avaliacao
WHERE
    clinica_id = current_user_clinica_id ();
-- ESPERADO: >= 0

-- 2.7 RH NÃO vê lotes de outras clínicas
SELECT COUNT(*) as lotes_outras_clinicas
FROM lotes_avaliacao
WHERE
    clinica_id != current_user_clinica_id ();
-- ESPERADO: 0

-- 2.8 RH vê avaliações de funcionários de sua clínica
SELECT COUNT(*) as avaliacoes_minha_clinica
FROM avaliacoes a
    JOIN funcionarios f ON f.cpf = a.funcionario_cpf
WHERE
    f.clinica_id = current_user_clinica_id ();
-- ESPERADO: >= 0

-- 2.9 RH NÃO vê avaliações de outras clínicas
SELECT COUNT(*) as avaliacoes_outras_clinicas
FROM avaliacoes a
    JOIN funcionarios f ON f.cpf = a.funcionario_cpf
WHERE
    f.clinica_id != current_user_clinica_id ();
-- ESPERADO: 0

-- RESET
RESET app.current_user_cpf;

RESET app.current_user_perfil;

RESET app.current_user_clinica_id;

-- ==========================================
-- TESTE 3: ISOLAMENTO EMISSOR
-- ==========================================

-- 3.1 Simular sessão de emissor
SET app.current_user_cpf = '99999999999';

SET app.current_user_perfil = 'emissor';

-- 3.2 Emissor vê apenas lotes liberados (finalizados/concluídos)
SELECT COUNT(*) as lotes_liberados
FROM lotes_avaliacao
WHERE
    status IN ('finalizado', 'concluido');
-- ESPERADO: >= 0

-- 3.3 Emissor NÃO vê lotes em andamento
SELECT COUNT(*) as lotes_ativos
FROM lotes_avaliacao
WHERE
    status = 'ativo';
-- ESPERADO: 0

-- 3.4 Emissor vê todos os laudos (pode gerenciar)
SELECT COUNT(*) as laudos_visiveis FROM laudos;
-- ESPERADO: >= 0

-- 3.5 Emissor NÃO deve ver funcionários (sem policy)
SELECT COUNT(*) as funcionarios_visiveis FROM funcionarios;
-- ESPERADO: 0

-- RESET
RESET app.current_user_cpf;

RESET app.current_user_perfil;

-- ==========================================
-- TESTE 4: ACESSO TOTAL ADMIN
-- ==========================================

-- 4.1 Simular sessão de admin
SET app.current_user_cpf = '88888888888';

SET app.current_user_perfil = 'admin';

-- 4.2 Admin vê TODOS os funcionários
SELECT COUNT(*) as total_funcionarios FROM funcionarios;
-- ESPERADO: Total de funcionários no banco (>= 1)

-- 4.3 Admin vê TODAS as avaliações
SELECT COUNT(*) as total_avaliacoes FROM avaliacoes;
-- ESPERADO: Total de avaliações no banco (>= 0)

-- 4.4 Admin vê TODAS as empresas
SELECT COUNT(*) as total_empresas FROM empresas_clientes;
-- ESPERADO: Total de empresas no banco (>= 0)

-- 4.5 Admin vê TODOS os lotes
SELECT COUNT(*) as total_lotes FROM lotes_avaliacao;
-- ESPERADO: Total de lotes no banco (>= 0)

-- 4.6 Admin vê TODOS os laudos
SELECT COUNT(*) as total_laudos FROM laudos;
-- ESPERADO: Total de laudos no banco (>= 0)

-- RESET
RESET app.current_user_cpf;

RESET app.current_user_perfil;

-- ==========================================
-- ==========================================

SET app.current_user_cpf = '00000000000';

SELECT COUNT(*) as total_funcionarios FROM funcionarios;
-- ESPERADO: Total de funcionários no banco

SELECT COUNT(*) as total_clinicas FROM clinicas;
-- ESPERADO: Total de clínicas no banco (>= 0)

SELECT (
        SELECT COUNT(*)
        FROM funcionarios
    ) as funcionarios,
    (
        SELECT COUNT(*)
        FROM avaliacoes
    ) as avaliacoes,
    (
        SELECT COUNT(*)
        FROM empresas_clientes
    ) as empresas,
    (
        SELECT COUNT(*)
        FROM lotes_avaliacao
    ) as lotes,
    (
        SELECT COUNT(*)
        FROM laudos
    ) as laudos,
    (
        SELECT COUNT(*)
        FROM clinicas
    ) as clinicas;
-- ESPERADO: Todos os totais do banco

-- RESET
RESET app.current_user_cpf;

RESET app.current_user_perfil;

-- ==========================================
-- TESTE 6: TESTE DE INSERÇÃO COM RLS
-- ==========================================

-- 6.1 Funcionário tenta inserir avaliação própria (DEVE FUNCIONAR)
SET app.current_user_cpf = '22222222222';

SET app.current_user_perfil = 'funcionario';

BEGIN;

INSERT INTO
    avaliacoes (
        funcionario_cpf,
        status,
        lote_id
    )
VALUES (
        '22222222222',
        'iniciada',
        NULL
    );
-- ESPERADO: Sucesso (policy permite)

-- Verificar se foi inserido
SELECT COUNT(*)
FROM avaliacoes
WHERE
    funcionario_cpf = '22222222222';

ROLLBACK;
-- Não comitar (é teste)

-- 6.2 Funcionário tenta inserir avaliação de OUTRO (DEVE FALHAR)
SET app.current_user_cpf = '22222222222';

SET app.current_user_perfil = 'funcionario';

BEGIN;

INSERT INTO
    avaliacoes (
        funcionario_cpf,
        status,
        lote_id
    )
VALUES (
        '33333333333',
        'iniciada',
        NULL
    );
-- ESPERADO: Falha (policy NÃO permite)
ROLLBACK;

-- RESET
RESET app.current_user_cpf;

RESET app.current_user_perfil;

-- ==========================================
-- TESTE 7: TESTE DE AUDITORIA
-- ==========================================

-- 7.1 Simular inserção com contexto
SET app.current_user_cpf = '11111111111';

SET app.current_user_perfil = 'admin';

BEGIN;

-- Inserir funcionário teste
INSERT INTO
    funcionarios (
        cpf,
        nome,
        perfil,
        senha_hash,
        clinica_id,
        nivel_cargo
    )
VALUES (
        '11122233344',
        'Teste Auditoria',
        'funcionario',
        'hash',
        1,
        'operacional'
    );

-- Verificar se foi registrado em audit_logs
SELECT
    user_cpf,
    user_perfil,
    action,
    resource,
    new_data ->> 'nome' as nome_inserido
FROM audit_logs
WHERE
    resource = 'funcionarios'
ORDER BY created_at DESC
LIMIT 1;
-- ESPERADO: Registro com action='INSERT', user_cpf='11111111111', nome='Teste Auditoria'

-- Atualizar funcionário
UPDATE funcionarios
SET
    nome = 'Teste Auditoria Modificado'
WHERE
    cpf = '11122233344';

-- Verificar update no log
SELECT
    action,
    old_data ->> 'nome' as nome_anterior,
    new_data ->> 'nome' as nome_novo
FROM audit_logs
WHERE
    resource = 'funcionarios'
    AND action = 'UPDATE'
ORDER BY created_at DESC
LIMIT 1;
-- ESPERADO: old_data='Teste Auditoria', new_data='Teste Auditoria Modificado'

-- Deletar funcionário
DELETE FROM funcionarios WHERE cpf = '11122233344';

-- Verificar delete no log
SELECT
    action,
    old_data ->> 'nome' as nome_deletado
FROM audit_logs
WHERE
    resource = 'funcionarios'
    AND action = 'DELETE'
ORDER BY created_at DESC
LIMIT 1;
-- ESPERADO: action='DELETE', old_data com dados do funcionário

ROLLBACK;
-- Não comitar (é teste)

-- RESET
RESET app.current_user_cpf;

RESET app.current_user_perfil;

-- ==========================================
-- TESTE 8: VERIFICAÇÃO DE PERFORMANCE
-- ==========================================

-- 8.1 Medir tempo de query com RLS (funcionário)
EXPLAIN ANALYZE
SELECT *
FROM avaliacoes
WHERE
    funcionario_cpf = '22222222222';
-- VERIFICAR: Execution Time (deve ser < 10ms com índices)

-- 8.2 Medir tempo de query com RLS (RH)
SET app.current_user_cpf = '11111111111';

SET app.current_user_perfil = 'rh';

SET app.current_user_clinica_id = '1';

EXPLAIN ANALYZE
SELECT f.*
FROM funcionarios f
WHERE
    f.clinica_id = current_user_clinica_id ();
-- VERIFICAR: Execution Time (deve ser < 10ms)

RESET app.current_user_cpf;

RESET app.current_user_perfil;

RESET app.current_user_clinica_id;

-- ==========================================
-- TESTE 9: RBAC - VERIFICAR PERMISSÕES
-- ==========================================

-- 9.1 Verificar permissões do funcionário
SELECT p.name, p.description
FROM
    role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
WHERE
    r.name = 'funcionario'
ORDER BY p.name;
-- ESPERADO: 4 permissões (read/write avaliacoes/funcionarios own)

-- 9.2 Verificar permissões do RH
SELECT p.name, p.description
FROM
    role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
WHERE
    r.name = 'rh'
ORDER BY p.name;
-- ESPERADO: 7 permissões (read/write avaliacoes/funcionarios/empresas/lotes clinica)

-- 9.3 Verificar permissões do emissor
SELECT p.name, p.description
FROM
    role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
WHERE
    r.name = 'emissor'
ORDER BY p.name;
-- ESPERADO: 3 permissões (read/write laudos, read lotes)

-- 9.4 Verificar permissões do admin
SELECT p.name, p.description
FROM
    role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
WHERE
    r.name = 'admin'
ORDER BY p.name;
-- ESPERADO: 5 permissões (manage avaliacoes/funcionarios/empresas/lotes/laudos)

-- ==========================================
-- TESTE 10: VIEWS DE SEGURANÇA
-- ==========================================

-- 10.1 Ver estatísticas de auditoria (após testes)
SELECT * FROM audit_stats_by_user LIMIT 10;

-- 10.2 Ver atividades suspeitas (se houver)
SELECT * FROM suspicious_activity;
-- ESPERADO: Vazio ou alertas se alguém fez >100 ações/hora

-- ==========================================
-- RESUMO DOS TESTES
-- ==========================================

-- Após executar todos os testes acima, validar:
-- ✅ Funcionário vê apenas seus dados
-- ✅ RH vê apenas dados de sua clínica
-- ✅ Emissor vê apenas lotes liberados
-- ✅ Admin vê tudo
-- ✅ Inserções respeitam policies
-- ✅ Auditoria registra INSERT/UPDATE/DELETE
-- ✅ Performance < 10ms
-- ✅ RBAC tem permissões corretas
-- ✅ Views de segurança funcionam

-- ==========================================
-- TROUBLESHOOTING
-- ==========================================

-- Se algum teste falhar:

-- 1. Verificar se RLS está ativo
SELECT tablename, rowsecurity
FROM pg_tables
WHERE
    schemaname = 'public'
    AND tablename IN (
        'funcionarios',
        'avaliacoes',
        'empresas_clientes',
        'lotes_avaliacao',
        'laudos'
    );

-- 2. Verificar policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE
    schemaname = 'public';

-- 3. Verificar contexto atual
SELECT
    current_setting ('app.current_user_cpf', true) as cpf,
    current_setting (
        'app.current_user_perfil',
        true
    ) as perfil,
    current_setting (
        'app.current_user_clinica_id',
        true
    ) as clinica_id;

-- 4. Verificar logs de erro do PostgreSQL
-- (console do psql mostrará erros de policies)

-- 5. Testar policy específica manualmente
-- Exemplo: Ver o que uma policy retorna
SELECT *
FROM funcionarios
WHERE (
        cpf = current_setting ('app.current_user_cpf', true)
        OR current_setting (
            'app.current_user_perfil',
            true
    );