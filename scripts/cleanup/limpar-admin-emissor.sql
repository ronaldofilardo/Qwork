-- ============================================================================
-- Script: Limpar Admin e Emissor
-- Data: 31/01/2026
-- Banco: nr-bps_db
-- ============================================================================
-- ATENÇÃO: Este script remove os funcionários admin (00000000000) e emissor (53051173991)
-- Execute com cuidado
-- ============================================================================

BEGIN;

-- Configurar variáveis necessárias para audit logs
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';

-- 1. Mostrar o que será deletado (para conferência)
\echo '==================== DADOS QUE SERÃO DELETADOS ===================='
\echo ''
\echo 'FUNCIONÁRIOS:'
SELECT 
    cpf,
    nome,
    perfil,
    email,
    ativo,
    criado_em
FROM funcionarios
WHERE cpf IN ('00000000000', '53051173991')
ORDER BY cpf;

\echo ''
\echo '==================== CONFIRMAÇÃO ===================='
\echo 'Revise os dados acima.'
\echo ''

-- Criar tabela temporária com os CPFs para deletar
CREATE TEMP TABLE funcionarios_para_deletar AS
SELECT cpf FROM funcionarios WHERE cpf IN ('00000000000', '53051173991');

\echo ''
\echo '==================== INICIANDO EXCLUSÃO ===================='
\echo ''

-- 2. Deletar avaliações vinculadas (se houver)
\echo 'Deletando avaliações...'
DELETE FROM avaliacoes
WHERE funcionario_cpf IN (SELECT cpf FROM funcionarios_para_deletar);

-- 3. Deletar respostas de avaliações
\echo 'Deletando respostas de avaliações...'
DELETE FROM respostas
WHERE avaliacao_id IN (
    SELECT id FROM avaliacoes 
    WHERE funcionario_cpf IN (SELECT cpf FROM funcionarios_para_deletar)
);

-- 4. Deletar os funcionários
\echo 'Deletando funcionários...'
DELETE FROM funcionarios
WHERE cpf IN (SELECT cpf FROM funcionarios_para_deletar);

-- Limpar tabela temporária
DROP TABLE funcionarios_para_deletar;

\echo ''
\echo '==================== EXCLUSÃO CONCLUÍDA ===================='
\echo ''

-- Verificação final
\echo 'Verificando resultado:'

SELECT 
    COUNT(*) as funcionarios_restantes,
    'funcionários (admin/emissor)' as tabela
FROM funcionarios
WHERE cpf IN ('00000000000', '53051173991');

\echo ''
\echo '==================== FINALIZAÇÃO ===================='
\echo 'Se os números acima estão zerados, a exclusão foi bem-sucedida.'
\echo ''

-- Confirmar as alterações
COMMIT;

\echo ''
\echo '✅ COMMIT executado! Alterações aplicadas ao banco de dados.'
\echo ''
