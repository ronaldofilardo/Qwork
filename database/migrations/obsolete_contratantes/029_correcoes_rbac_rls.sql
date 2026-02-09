-- ==========================================
-- MIGRAÇÃO 029: CORREÇÕES RBAC/RLS - NÍVEL ALTO
-- Data: 2025-12-22
-- Descrição: Correções críticas de segurança e permissões
-- ==========================================

BEGIN;

-- ==========================================
-- 1. IMPLEMENTAR FUNÇÕES current_user_*()
-- ==========================================

-- Criar função para obter CPF do usuário atual
CREATE OR REPLACE FUNCTION current_user_cpf()
RETURNS VARCHAR(11) AS $$
BEGIN
    RETURN nullif(current_setting('app.current_user_cpf', true), '');
END;
$$ LANGUAGE plpgsql STABLE;

-- Criar função para obter perfil do usuário atual
CREATE OR REPLACE FUNCTION current_user_perfil()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN nullif(current_setting('app.current_user_perfil', true), '');
END;
$$ LANGUAGE plpgsql STABLE;

-- Criar função para obter clinica_id do usuário atual
CREATE OR REPLACE FUNCTION current_user_clinica_id()
RETURNS INTEGER AS $$
DECLARE
    clinica_id_str VARCHAR(50);
    clinica_id_int INTEGER;
BEGIN
    clinica_id_str := nullif(current_setting('app.current_user_clinica_id', true), '');
    IF clinica_id_str IS NOT NULL THEN
        clinica_id_int := clinica_id_str::INTEGER;
        RETURN clinica_id_int;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- 2. CORREÇÃO DE POLÍTICAS RLS PARA tomadores
-- ==========================================

-- Política para responsável atualizar apenas durante cadastro (permitir updates antes de aprovação)
DROP POLICY IF EXISTS tomadores_responsavel_update ON tomadores;
CREATE POLICY tomadores_responsavel_update ON tomadores
    FOR UPDATE TO PUBLIC
    USING (
        responsavel_cpf = current_user_cpf()
        AND status IN ('pendente', 'em_reanalise', 'aguardando_pagamento')
    );

-- ==========================================
-- 3. MELHORAR POLÍTICAS PARA CONTRATOS
-- ==========================================

-- Adicionar validação de plano válido nas políticas de contratos
DROP POLICY IF EXISTS contratos_responsavel_insert ON contratos;
CREATE POLICY contratos_responsavel_insert ON contratos
    FOR INSERT TO PUBLIC
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tomadores c
            WHERE c.id = contratante_id
            AND c.responsavel_cpf = current_user_cpf()
        )
        AND EXISTS (
            SELECT 1 FROM planos p
            WHERE p.id = plano_id
            AND p.ativo = true
        )
    );

-- ==========================================
-- 4. ADICIONAR ENTIDADE_ID À SESSÃO
-- ==========================================

-- Nota: Esta alteração requer mudanças no código da aplicação
-- para definir app.current_user_entidade_id nas sessões
-- (anteriormente app.current_user_contratante_id - manter ambos para retrocompatibilidade)

-- Adicionar função auxiliar para entidade_id (novo nome)
CREATE OR REPLACE FUNCTION current_user_entidade_id()
RETURNS INTEGER AS $$
DECLARE
    entidade_id_str VARCHAR(50);
    entidade_id_int INTEGER;
BEGIN
    -- Tentar primeiro o novo nome (entidade_id)
    entidade_id_str := nullif(current_setting('app.current_user_entidade_id', true), '');
    IF entidade_id_str IS NOT NULL THEN
        entidade_id_int := entidade_id_str::INTEGER;
        RETURN entidade_id_int;
    END IF;
    
    -- Fallback para nome antigo (contratante_id) para retrocompatibilidade
    entidade_id_str := nullif(current_setting('app.current_user_contratante_id', true), '');
    IF entidade_id_str IS NOT NULL THEN
        entidade_id_int := entidade_id_str::INTEGER;
        RETURN entidade_id_int;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Manter função antiga como alias para retrocompatibilidade
CREATE OR REPLACE FUNCTION current_user_contratante_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN current_user_entidade_id();
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- 5. AUDITORIA EM POLÍTICAS RLS
-- ==========================================

-- Criar função para log de acessos RLS negados
CREATE OR REPLACE FUNCTION log_rls_violation()
RETURNS event_trigger AS $$
DECLARE
    r RECORD;
BEGIN
    -- Log básico de violação RLS (pode ser expandido)
    INSERT INTO audit_logs (resource, action, details, ip_address, user_agent)
    VALUES (
        'rls_policy',
        'violation',
        'RLS policy violation detected',
        nullif(current_setting('app.current_user_ip', true), ''),
        nullif(current_setting('app.current_user_agent', true), '')
    );
EXCEPTION
    WHEN others THEN
        -- Não falhar se auditoria falhar
        NULL;
END;
$$ LANGUAGE plpgsql;

-- Nota: Event triggers para RLS são complexos de implementar
-- Uma abordagem melhor seria adicionar logs nas próprias políticas

-- ==========================================
-- 6. POLÍTICAS MAIS RESTRITIVAS PARA ENTIDADES_SENHAS
-- ==========================================
-- Nota: Tabela renomeada de 'entidades_senhas' para 'entidades_senhas' na Migration 420

-- Garantir que apenas o próprio responsável possa ver sua senha
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        DROP POLICY IF EXISTS entidades_senhas_responsavel ON entidades_senhas;
        CREATE POLICY entidades_senhas_responsavel ON entidades_senhas
            FOR ALL TO PUBLIC
            USING (cpf = current_user_cpf());
        RAISE NOTICE 'Policy entidades_senhas_responsavel criada';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        DROP POLICY IF EXISTS entidades_senhas_responsavel ON entidades_senhas;
        CREATE POLICY entidades_senhas_responsavel ON entidades_senhas
            FOR ALL TO PUBLIC
            USING (cpf = current_user_cpf());
        RAISE NOTICE 'Policy entidades_senhas_responsavel criada (tabela será renomeada na Migration 420)';
    END IF;
END $$;

-- ==========================================
-- 7. VALIDAÇÕES ADICIONAIS DE SEGURANÇA
-- ==========================================

-- Impedir updates em campos críticos após aprovação
CREATE OR REPLACE FUNCTION impedir_alteracao_campos_criticos()
RETURNS TRIGGER AS $$
BEGIN
    -- Se já aprovado, impedir alteração de dados críticos
    IF OLD.status = 'aprovado' THEN
        IF OLD.cnpj != NEW.cnpj
            OR OLD.responsavel_cpf != NEW.responsavel_cpf
            OR OLD.email != NEW.email THEN
            RAISE EXCEPTION 'Não é possível alterar dados críticos após aprovação';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_impedir_alteracao_critica ON tomadores;
CREATE TRIGGER trg_impedir_alteracao_critica
    BEFORE UPDATE ON tomadores
    FOR EACH ROW
    EXECUTE FUNCTION impedir_alteracao_campos_criticos();

-- ==========================================
-- 8. POLÍTICAS PARA PAGAMENTOS
-- ==========================================

-- Melhorar política de pagamentos para incluir validações
DROP POLICY IF EXISTS pagamentos_responsavel_select ON pagamentos;
CREATE POLICY pagamentos_responsavel_select ON pagamentos
    FOR SELECT TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM tomadores c
            WHERE c.id = pagamentos.contratante_id
            AND c.responsavel_cpf = current_user_cpf()
            AND c.status = 'aprovado'
        )
    );

COMMIT;

-- ==========================================
-- FIM DA MIGRAÇÃO
-- ==========================================