-- Script para limpar TODOS os dados do banco nr-bps_db
-- ATENÇÃO: Esta operação é IRREVERSà VEL e apaga todos os dados!
-- Criado em: 2026-01-07

-- Desabilitar triggers temporariamente para evitar problemas
SET session_replication_role = 'replica';

-- Limpar tabelas na ordem correta (respeitando foreign keys)
-- Começar pelas tabelas dependentes e ir subindo

-- 1. Respostas e resultados de avaliações
TRUNCATE TABLE respostas_avaliacoes CASCADE;
TRUNCATE TABLE resultados_avaliacoes CASCADE;
TRUNCATE TABLE anomalias_avaliacao CASCADE;

-- 2. Avaliações
TRUNCATE TABLE avaliacoes CASCADE;

-- 3. Lotes de avaliação
TRUNCATE TABLE lotes_avaliacao CASCADE;

-- 4. Funcionários
TRUNCATE TABLE funcionarios CASCADE;

-- 5. Empresas clientes
TRUNCATE TABLE empresas_clientes CASCADE;

-- 6. Pagamentos
TRUNCATE TABLE pagamentos CASCADE;

-- 7. Planos
TRUNCATE TABLE planos CASCADE;

-- 8. Clínicas
TRUNCATE TABLE clinicas CASCADE;

-- 9. Entidades (empregadores)
TRUNCATE TABLE entidades CASCADE;

-- 10. Logs e auditoria
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE system_logs CASCADE;

-- 11. Notificações
TRUNCATE TABLE notificacoes CASCADE;

-- 12. Sessões
TRUNCATE TABLE sessions CASCADE;

-- 13. Tabelas auxiliares
TRUNCATE TABLE perguntas_copsoq CASCADE;
TRUNCATE TABLE grupos_perguntas CASCADE;

-- Reabilitar triggers
SET session_replication_role = 'origin';

-- Resetar todas as sequences para começar do 1
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || r.sequence_name || ' RESTART WITH 1';
    END LOOP;
END $$;

-- Verificar se as tabelas estão vazias
SELECT 
    'clinicas' as tabela, COUNT(*) as registros FROM clinicas
UNION ALL
SELECT 'entidades', COUNT(*) FROM entidades
UNION ALL
SELECT 'empresas_clientes', COUNT(*) FROM empresas_clientes
UNION ALL
SELECT 'funcionarios', COUNT(*) FROM funcionarios
UNION ALL
SELECT 'avaliacoes', COUNT(*) FROM avaliacoes
UNION ALL
SELECT 'respostas_avaliacoes', COUNT(*) FROM respostas_avaliacoes
UNION ALL
SELECT 'resultados_avaliacoes', COUNT(*) FROM resultados_avaliacoes
UNION ALL
SELECT 'pagamentos', COUNT(*) FROM pagamentos
UNION ALL
SELECT 'planos', COUNT(*) FROM planos
UNION ALL
SELECT 'lotes_avaliacao', COUNT(*) FROM lotes_avaliacao
UNION ALL
SELECT 'notificacoes', COUNT(*) FROM notificacoes
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;
