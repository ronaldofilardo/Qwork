-- ============================================================================
-- Script: Limpar Contratantes e Gestores Entidade
-- Data: 31/01/2026
-- Banco: nr-bps_db
-- ============================================================================
-- ATENÇÃO: Este script remove TODOS os contratantes tipo 'entidade' e seus gestores
-- Execute com cuidado e apenas em ambiente de desenvolvimento/testes
-- ============================================================================

BEGIN;

-- Configurar variáveis necessárias para audit logs
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';

-- 1. Mostrar o que será deletado (para conferência)
\echo '==================== DADOS QUE SERÃO DELETADOS ===================='

\echo ''
\echo '1. CONTRATANTES (tipo = entidade):'
SELECT 
    id,
    tipo,
    nome,
    cnpj,
    criado_em
FROM contratantes
WHERE tipo = 'entidade'
ORDER BY id;

\echo ''
\echo '2. GESTORES ENTIDADE (entidades_senhas):'
SELECT 
    cs.cpf,
    cs.contratante_id,
    c.nome,
    cs.criado_em
FROM entidades_senhas cs
JOIN contratantes c ON c.id = cs.contratante_id
WHERE c.tipo = 'entidade'
ORDER BY cs.contratante_id;

\echo ''
\echo '3. FUNCIONÁRIOS VINCULADOS (contratante_id):'
SELECT 
    f.cpf,
    f.nome,
    f.perfil,
    f.contratante_id,
    c.nome as empresa
FROM funcionarios f
JOIN contratantes c ON c.id = f.contratante_id
WHERE c.tipo = 'entidade'
  AND f.perfil = 'gestor'
ORDER BY f.contratante_id;

\echo ''
\echo '4. LOTES DE AVALIAÇÃO (contratante_id):'
SELECT 
    la.id,
    
    la.contratante_id,
    la.status,
    c.nome as empresa
FROM lotes_avaliacao la
JOIN contratantes c ON c.id = la.contratante_id
WHERE c.tipo = 'entidade'
ORDER BY la.contratante_id;

\echo ''
\echo '5. AVALIAÇÕES (via funcionarios com contratante_id):'
SELECT 
    COUNT(*) as total_avaliacoes,
    f.contratante_id,
    c.nome as empresa
FROM avaliacoes a
JOIN funcionarios f ON f.cpf = a.funcionario_cpf
JOIN contratantes c ON c.id = f.contratante_id
WHERE c.tipo = 'entidade'
GROUP BY f.contratante_id, c.nome
ORDER BY f.contratante_id;

\echo ''
\echo '==================== CONFIRMAÇÃO ===================='
\echo 'Revise os dados acima.'
\echo 'Se confirmar a exclusão, execute: COMMIT;'
\echo 'Para cancelar, execute: ROLLBACK;'
\echo ''

-- ============================================================================
-- EXCLUSÃO DOS DADOS (em ordem para respeitar foreign keys)
-- ============================================================================

-- Obter IDs dos contratantes que serão deletados
CREATE TEMP TABLE contratantes_para_deletar AS
SELECT id FROM contratantes WHERE tipo = 'entidade';

\echo ''
\echo '==================== INICIANDO EXCLUSÃO ===================='

-- 2. Deletar avaliações de funcionários vinculados aos contratantes
\echo ''
\echo 'Deletando avaliações...'
DELETE FROM avaliacoes
WHERE funcionario_cpf IN (
    SELECT cpf 
    FROM funcionarios 
    WHERE contratante_id IN (SELECT id FROM contratantes_para_deletar)
);

-- 3. Deletar respostas de avaliações (se houver referências)
\echo 'Deletando respostas de avaliações...'
DELETE FROM respostas
WHERE avaliacao_id IN (
    SELECT a.id
    FROM avaliacoes a
    JOIN funcionarios f ON f.cpf = a.funcionario_cpf
    WHERE f.contratante_id IN (SELECT id FROM contratantes_para_deletar)
);

-- 4. Deletar resultados de avaliações (se houver referências)
\echo 'Deletando resultados...'
DELETE FROM resultados
WHERE avaliacao_id IN (
    SELECT a.id
    FROM avaliacoes a
    JOIN funcionarios f ON f.cpf = a.funcionario_cpf
    WHERE f.contratante_id IN (SELECT id FROM contratantes_para_deletar)
);

-- 5. Deletar lotes de avaliação dos contratantes
\echo 'Deletando lotes de avaliação...'
DELETE FROM lotes_avaliacao
WHERE contratante_id IN (SELECT id FROM contratantes_para_deletar);

-- 6. Deletar funcionários vinculados aos contratantes (incluindo gestores)
\echo 'Deletando funcionários vinculados (incluindo gestores)...'
DELETE FROM funcionarios
WHERE contratante_id IN (SELECT id FROM contratantes_para_deletar);

-- 7. Deletar senhas dos gestores (entidades_senhas)
\echo 'Deletando senhas dos gestores (entidades_senhas)...'
DELETE FROM entidades_senhas
WHERE contratante_id IN (SELECT id FROM contratantes_para_deletar);

-- 8. Deletar pagamentos relacionados
\echo 'Deletando pagamentos...'
DELETE FROM pagamentos
WHERE contratante_id IN (SELECT id FROM contratantes_para_deletar);

-- 9. Deletar contratos relacionados
\echo 'Deletando contratos...'
DELETE FROM contratos
WHERE contratante_id IN (SELECT id FROM contratantes_para_deletar);

-- 10. Deletar notificações relacionadas (via lote_id)
\echo 'Deletando notificações...'
DELETE FROM notificacoes_admin
WHERE lote_id IN (
    SELECT id FROM lotes_avaliacao 
    WHERE contratante_id IN (SELECT id FROM contratantes_para_deletar)
);

-- 11. Por último, deletar os contratantes
\echo 'Deletando contratantes...'
DELETE FROM contratantes
WHERE id IN (SELECT id FROM contratantes_para_deletar);

-- Limpar tabela temporária
DROP TABLE contratantes_para_deletar;

\echo ''
\echo '==================== EXCLUSÃO CONCLUÍDA ===================='
\echo ''
\echo 'Verificando resultado:'

-- Verificar se ainda existem contratantes tipo entidade
SELECT 
    COUNT(*) as contratantes_restantes,
    'contratantes tipo entidade' as tabela
FROM contratantes
WHERE tipo = 'entidade'

UNION ALL

SELECT 
    COUNT(*) as gestores_restantes,
    'gestores em entidades_senhas' as tabela
FROM entidades_senhas cs
LEFT JOIN contratantes c ON c.id = cs.contratante_id
WHERE c.tipo = 'entidade' OR c.id IS NULL;

\echo ''
\echo '==================== FINALIZAÇÃO ===================='
\echo 'Se os números acima estão zerados, a exclusão foi bem-sucedida.'
\echo ''

-- Confirmar as alterações
COMMIT;

\echo ''
\echo '✅ COMMIT executado! Alterações aplicadas ao banco de dados.'
\echo ''
