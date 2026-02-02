-- ============================================================================
-- Migration 997: Implementar RLS em fila_emissao
-- Data: 2026-01-30
-- Descrição: Adiciona Row-Level Security na tabela fila_emissao
-- ============================================================================
-- 
-- OBJETIVO: Proteger fila de emissão com políticas de acesso granulares
-- IMPACTO: Apenas sistema e emissores autorizados podem manipular a fila
-- ============================================================================

BEGIN;

\echo '========================================='
\echo 'MIGRATION 997: RLS EM fila_emissao'
\echo '========================================='

-- ============================================================================
-- 1. ATIVAR ROW LEVEL SECURITY
-- ============================================================================
\echo '1. Ativando Row-Level Security...'

-- Habilitar RLS na tabela
ALTER TABLE fila_emissao ENABLE ROW LEVEL SECURITY;

-- Forçar RLS mesmo para owner (segurança máxima)
ALTER TABLE fila_emissao FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CRIAR FUNÇÃO AUXILIAR PARA VALIDAÇÃO DE PERFIL
-- ============================================================================
\echo '2. Criando função auxiliar para perfil...'

-- Função para obter perfil do usuário atual
CREATE OR REPLACE FUNCTION current_user_perfil()
RETURNS TEXT AS $$
DECLARE
    perfil_usuario TEXT;
BEGIN
    -- Tentar obter perfil da sessão
    BEGIN
        perfil_usuario := current_setting('app.current_user_perfil', true);
    EXCEPTION WHEN OTHERS THEN
        perfil_usuario := NULL;
    END;
    
    -- Se não houver perfil na sessão, retornar NULL (sem acesso)
    RETURN perfil_usuario;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Garantir que função pode ser executada por todos
GRANT EXECUTE ON FUNCTION current_user_perfil() TO PUBLIC;

-- ============================================================================
-- 3. CRIAR POLÍTICA: SISTEMA PODE TUDO
-- ============================================================================
\echo '3. Criando política de acesso do sistema...'

-- Policy: Sistema com bypass tem acesso total
CREATE POLICY fila_emissao_system_bypass ON fila_emissao
FOR ALL TO PUBLIC
USING (
    -- Permitir quando flag de sistema está ativa
    COALESCE(current_setting('app.system_bypass', true), 'false') = 'true'
)
WITH CHECK (
    COALESCE(current_setting('app.system_bypass', true), 'false') = 'true'
);

-- ============================================================================
-- 4. CRIAR POLÍTICA: EMISSOR PODE VISUALIZAR
-- ============================================================================
\echo '4. Criando política de leitura para emissor...'

-- Policy: Emissor pode visualizar a fila (somente leitura)
CREATE POLICY fila_emissao_emissor_view ON fila_emissao
FOR SELECT TO PUBLIC
USING (
    current_user_perfil() = 'emissor'
);

-- ============================================================================
-- 5. CRIAR POLÍTICA: EMISSOR PODE ATUALIZAR TENTATIVAS
-- ============================================================================
\echo '5. Criando política de atualização para emissor...'

-- Policy: Emissor pode atualizar status da emissão
CREATE POLICY fila_emissao_emissor_update ON fila_emissao
FOR UPDATE TO PUBLIC
USING (
    current_user_perfil() = 'emissor'
)
WITH CHECK (
    current_user_perfil() = 'emissor'
);

-- ============================================================================
-- 6. CRIAR POLÍTICA: ADMIN PODE VISUALIZAR TUDO
-- ============================================================================
\echo '6. Criando política de leitura para admin...'

-- Policy: Admin pode visualizar toda a fila (auditoria)
CREATE POLICY fila_emissao_admin_view ON fila_emissao
FOR SELECT TO PUBLIC
USING (
    current_user_perfil() = 'admin'
);

-- ============================================================================
-- 7. DOCUMENTAR POLICIES CRIADAS
-- ============================================================================
\echo '7. Documentando policies...'

COMMENT ON POLICY fila_emissao_system_bypass ON fila_emissao IS 
'Permite acesso total quando app.system_bypass = true (APIs internas)';

COMMENT ON POLICY fila_emissao_emissor_view ON fila_emissao IS 
'Emissor pode visualizar fila de trabalho (SELECT)';

COMMENT ON POLICY fila_emissao_emissor_update ON fila_emissao IS 
'Emissor pode atualizar tentativas e erros (UPDATE)';

COMMENT ON POLICY fila_emissao_admin_view ON fila_emissao IS 
'Admin pode visualizar toda fila para auditoria (SELECT)';

-- ============================================================================
-- 8. VALIDAÇÃO E TESTES
-- ============================================================================
\echo '8. Validando políticas criadas...'

DO $$
DECLARE
    total_policies INTEGER;
    rls_enabled BOOLEAN;
    rls_forced BOOLEAN;
BEGIN
    -- Verificar se RLS está ativo
    SELECT relrowsecurity, relforcerowsecurity INTO rls_enabled, rls_forced
    FROM pg_class
    WHERE relname = 'fila_emissao';
    
    -- Contar políticas
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies
    WHERE tablename = 'fila_emissao';
    
    -- Exibir resultado
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'VALIDAÇÃO DE RLS:';
    RAISE NOTICE 'RLS Habilitado: %', rls_enabled;
    RAISE NOTICE 'RLS Forçado: %', rls_forced;
    RAISE NOTICE 'Total de políticas: %', total_policies;
    RAISE NOTICE '===========================================';
    
    -- Validar que tudo está correto
    IF NOT rls_enabled THEN
        RAISE EXCEPTION 'RLS não foi habilitado corretamente!';
    END IF;
    
    IF NOT rls_forced THEN
        RAISE EXCEPTION 'RLS não foi forçado corretamente!';
    END IF;
    
    IF total_policies < 4 THEN
        RAISE EXCEPTION 'Políticas insuficientes criadas! Esperado: 4, Atual: %', total_policies;
    END IF;
    
    RAISE NOTICE 'Todas as validações passaram com sucesso!';
END $$;

COMMIT;

\echo 'Migration 997 concluída com sucesso!'
