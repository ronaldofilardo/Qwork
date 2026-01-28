-- ============================================================================
-- Script de Limpeza Completa do Banco nr-bps_db
-- ============================================================================
-- Desenvolvedor: Admin do Sistema
-- Data: 20/01/2026
-- Justificativa: Limpeza pós-refatoração para remover dados de teste
-- ============================================================================
-- ATENÇÃO: Este script remove TODOS os dados do banco de dados.
-- A estrutura (tabelas, funções, views) será mantida.
-- NÃO HÁ BACKUP - Use apenas em ambiente de desenvolvimento!
-- ============================================================================

BEGIN;

-- Desabilitar triggers temporariamente para evitar conflitos
SET session_replication_role = 'replica';

-- ============================================================================
-- FASE 1: Limpar tabelas de dados operacionais (ordem reversa de dependência)
-- ============================================================================

-- Tabelas de auditoria e logs
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE auditoria CASCADE;
TRUNCATE TABLE auditoria_laudos CASCADE;
TRUNCATE TABLE auditoria_planos CASCADE;
TRUNCATE TABLE session_logs CASCADE;

-- Tabelas de notificações
TRUNCATE TABLE notificacoes CASCADE;
TRUNCATE TABLE notificacoes_admin CASCADE;
TRUNCATE TABLE notificacoes_financeiras CASCADE;

-- Tabelas de avaliação (dependem de funcionários e lotes)
TRUNCATE TABLE respostas CASCADE;
TRUNCATE TABLE resultados CASCADE;
TRUNCATE TABLE avaliacoes CASCADE;
TRUNCATE TABLE avaliacao_resets CASCADE;

-- Tabelas de lotes de avaliação
TRUNCATE TABLE lotes_avaliacao_funcionarios CASCADE;
TRUNCATE TABLE lotes_avaliacao CASCADE;

-- Tabelas de laudos
TRUNCATE TABLE laudos CASCADE;

-- Tabelas de análise estatística
TRUNCATE TABLE analise_estatistica CASCADE;

-- Tabelas de funcionários
TRUNCATE TABLE funcionarios CASCADE;
TRUNCATE TABLE contratantes_funcionarios CASCADE;

-- Tabelas de empresas clientes
TRUNCATE TABLE clinicas_empresas CASCADE;
TRUNCATE TABLE empresas_clientes CASCADE;

-- Tabelas de contratação e pagamentos
TRUNCATE TABLE recibos CASCADE;
TRUNCATE TABLE pagamentos CASCADE;
TRUNCATE TABLE contratos CASCADE;
TRUNCATE TABLE contratacao_personalizada CASCADE;
TRUNCATE TABLE historico_contratos_planos CASCADE;
TRUNCATE TABLE contratos_planos CASCADE;

-- Tabelas de contratantes (entidades)
TRUNCATE TABLE contratantes_snapshots CASCADE;
TRUNCATE TABLE contratantes_senhas CASCADE;
TRUNCATE TABLE contratantes CASCADE;

-- Tabelas de clínicas
TRUNCATE TABLE clinicas CASCADE;

-- Tabelas de usuários e autenticação
TRUNCATE TABLE mfa_codes CASCADE;
TRUNCATE TABLE usuarios CASCADE;

-- ============================================================================
-- FASE 2: Resetar sequences (auto-increment IDs)
-- ============================================================================

-- Resetar sequences para começar do 1 novamente
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequence_name) || ' RESTART WITH 1';
    END LOOP;
END $$;

-- ============================================================================
-- FASE 3: Reabilitar triggers
-- ============================================================================

SET session_replication_role = 'origin';

COMMIT;

-- ============================================================================
-- Verificação: Contar registros em tabelas principais
-- ============================================================================

SELECT 'clinicas' AS tabela, COUNT(*) AS registros FROM clinicas
UNION ALL
SELECT 'contratantes', COUNT(*) FROM contratantes
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'funcionarios', COUNT(*) FROM funcionarios
UNION ALL
SELECT 'avaliacoes', COUNT(*) FROM avaliacoes
UNION ALL
SELECT 'lotes_avaliacao', COUNT(*) FROM lotes_avaliacao
UNION ALL
SELECT 'laudos', COUNT(*) FROM laudos
UNION ALL
SELECT 'notificacoes', COUNT(*) FROM notificacoes
UNION ALL
SELECT 'empresas_clientes', COUNT(*) FROM empresas_clientes
UNION ALL
SELECT 'respostas', COUNT(*) FROM respostas
ORDER BY tabela;

-- ============================================================================
-- Mensagem final
-- ============================================================================

SELECT '✓ Banco de dados limpo com sucesso!' AS status,
       'Todas as tabelas foram esvaziadas' AS detalhes,
       'Estrutura do banco mantida intacta' AS observacao;
