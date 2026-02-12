-- Rollback Migration: Remover tabela confirmacao_identidade
-- Objetivo: Reverter a migration 1012 em caso de necessidade
-- Data: 2026-02-12
-- ATENÇÃO: Execute apenas em produção se absolutamente necessário!

-- ============================================================================
-- PASSO 1: Remover Trigger
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_auditoria_confirmacao_identidade ON confirmacao_identidade;

-- ============================================================================
-- PASSO 2: Remover Função de Auditoria
-- ============================================================================

DROP FUNCTION IF EXISTS registrar_auditoria_confirmacao_identidade();

-- ============================================================================
-- PASSO 3: Remover Políticas RLS (se existirem)
-- ============================================================================

DROP POLICY IF EXISTS funcionario_view_own_confirmations ON confirmacao_identidade;
DROP POLICY IF EXISTS rh_view_clinic_confirmations ON confirmacao_identidade;
DROP POLICY IF EXISTS gestor_view_entity_confirmations ON confirmacao_identidade;
DROP POLICY IF EXISTS admin_emissor_full_access ON confirmacao_identidade;
DROP POLICY IF EXISTS system_insert_confirmations ON confirmacao_identidade;

-- ============================================================================
-- PASSO 4: Remover Tabela (com cascata de índices e constraints)
-- ============================================================================

DROP TABLE IF EXISTS confirmacao_identidade CASCADE;

-- ============================================================================
-- FIM DO ROLLBACK
-- ============================================================================

\echo 'Rollback concluído: Tabela confirmacao_identidade e componentes removidos'
