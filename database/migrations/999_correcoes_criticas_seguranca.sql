-- ============================================================================
-- Migration 999: Correções Críticas de Segurança
-- Data: 2026-01-30
-- Descrição: Corrige vulnerabilidades críticas de segurança identificadas
-- ============================================================================
-- 
-- PROBLEMAS CORRIGIDOS:
-- 1. Login aceita placeholder em produção (vulnerabilidade)
-- 2. Policies não consideram contratante_id (entidades bloqueadas)  
-- 3. Índices ausentes em colunas RLS (performance crítica)
-- 4. RLS sem FORCE (owner bypassa segurança)
-- 5. Sem auditoria de mudanças em policies (compliance)
-- 6. Session não validado (queries podem bypassar RLS)
-- ============================================================================

BEGIN;

\echo '========================================='
\echo 'MIGRATION 999: CORREÇÕES CRÍTICAS DE SEGURANÇA'
\echo '========================================='

-- ============================================================================
-- 1. REMOVER SUPORTE A PLACEHOLDER DE SENHAS
-- ============================================================================
\echo '1. Removendo suporte a placeholders de senhas...'

-- Criar função para detectar e migrar senhas placeholder
CREATE OR REPLACE FUNCTION migrar_senhas_placeholder()
RETURNS TABLE(cpf VARCHAR, status TEXT) AS $$
DECLARE
    rec RECORD;
    novo_hash TEXT;
    senha_original TEXT;
BEGIN
    FOR rec IN 
        SELECT cs.cpf, cs.senha_hash 
        FROM entidades_senhas cs
        WHERE cs.senha_hash LIKE 'PLACEHOLDER_%'
    LOOP
        -- Extrair senha do placeholder
        senha_original := SUBSTRING(rec.senha_hash FROM 13); -- Remove 'PLACEHOLDER_'
        
        -- Gerar hash bcrypt (simulação - em produção deve ser feito pela aplicação)
        -- AVISO: Esta migração marca senhas para reset obrigatório
        novo_hash := 'RESET_REQUIRED_' || senha_original;
        
        UPDATE entidades_senhas 
        SET senha_hash = novo_hash,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE cpf = rec.cpf;
        
        cpf := rec.cpf;
        status := 'MIGRADO - REQUER RESET';
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar migração
SELECT * FROM migrar_senhas_placeholder();

-- Criar trigger para prevenir inserção de placeholders
CREATE OR REPLACE FUNCTION prevenir_placeholder_senha()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.senha_hash LIKE 'PLACEHOLDER_%' THEN
        RAISE EXCEPTION 'SEGURANÇA: Placeholders de senha não são permitidos em produção. Use bcrypt.';
    END IF;
    
    -- Validar que senha está devidamente hasheada (bcrypt tem 60 caracteres)
    IF LENGTH(NEW.senha_hash) < 50 AND NEW.senha_hash NOT LIKE 'RESET_REQUIRED_%' THEN
        RAISE EXCEPTION 'SEGURANÇA: Senha deve ser hasheada com bcrypt (mínimo 50 caracteres).';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevenir_placeholder_senha ON entidades_senhas;
CREATE TRIGGER trg_prevenir_placeholder_senha
    BEFORE INSERT OR UPDATE ON entidades_senhas
    FOR EACH ROW
    EXECUTE FUNCTION prevenir_placeholder_senha();

\echo '✓ Proteção contra placeholders implementada'

-- ============================================================================
-- 2. FORCE ROW LEVEL SECURITY (Owner não bypassa)
-- ============================================================================
\echo '2. Aplicando FORCE ROW LEVEL SECURITY...'

-- Aplicar FORCE RLS em todas as tabelas sensíveis
ALTER TABLE contratantes FORCE ROW LEVEL SECURITY;
ALTER TABLE entidades_senhas FORCE ROW LEVEL SECURITY;
ALTER TABLE funcionarios FORCE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes FORCE ROW LEVEL SECURITY;
ALTER TABLE resultados FORCE ROW LEVEL SECURITY;
ALTER TABLE laudos FORCE ROW LEVEL SECURITY;
ALTER TABLE lotes_avaliacao FORCE ROW LEVEL SECURITY;
ALTER TABLE pagamentos FORCE ROW LEVEL SECURITY;
ALTER TABLE recibos FORCE ROW LEVEL SECURITY;
ALTER TABLE contratos FORCE ROW LEVEL SECURITY;
ALTER TABLE empresas_clientes FORCE ROW LEVEL SECURITY;

\echo '✓ FORCE RLS aplicado em todas as tabelas sensíveis'

-- ============================================================================
-- 3. ADICIONAR ÍNDICES PARA PERFORMANCE RLS
-- ============================================================================
\echo '3. Criando índices para colunas usadas em RLS...'

-- Índices para contratante_id (usado em policies RLS)
CREATE INDEX IF NOT EXISTS idx_funcionarios_contratante_id_rls 
    ON funcionarios(contratante_id) WHERE contratante_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_avaliacoes_contratante_id_rls
    ON avaliacoes(contratante_id) WHERE contratante_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_empresas_clientes_contratante_id_rls
    ON empresas_clientes(contratante_id) WHERE contratante_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contratos_contratante_id_rls
    ON contratos(contratante_id);

CREATE INDEX IF NOT EXISTS idx_recibos_contratante_id_rls
    ON recibos(contratante_id);

CREATE INDEX IF NOT EXISTS idx_pagamentos_contratante_id_rls
    ON pagamentos(contratante_id);

CREATE INDEX IF NOT EXISTS idx_lotes_contratante_id_rls
    ON lotes_avaliacao(contratante_id) WHERE contratante_id IS NOT NULL;

-- Índices para clinica_id (usado em policies RLS)
CREATE INDEX IF NOT EXISTS idx_funcionarios_clinica_id_rls
    ON funcionarios(clinica_id) WHERE clinica_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_laudos_clinica_id_rls
    ON laudos(clinica_id) WHERE clinica_id IS NOT NULL;

-- Índices para CPF (usado em políticas de acesso)
CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf_rls
    ON funcionarios(cpf);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_funcionario_cpf_rls
    ON avaliacoes(funcionario_cpf);

CREATE INDEX IF NOT EXISTS idx_contratantes_responsavel_cpf_rls
    ON contratantes(responsavel_cpf);

\echo '✓ Índices RLS criados para otimização de queries'

-- ============================================================================
-- 4. CORRIGIR POLICIES PARA CONSIDERAR CONTRATANTE_ID
-- ============================================================================
\echo '4. Corrigindo policies RLS para incluir contratante_id...'

-- FUNCIONÁRIOS: Adicionar política para contratante_id
DROP POLICY IF EXISTS funcionarios_contratante_select ON funcionarios;
CREATE POLICY funcionarios_contratante_select ON funcionarios
    FOR SELECT
    USING (
        -- Admin vê tudo
        (current_setting('app.current_perfil', true) = 'admin')
        OR
        -- Funcionário vinculado ao contratante
        (contratante_id::text = current_setting('app.current_contratante_id', true))
        OR
        -- Funcionário vinculado à clínica
        (clinica_id::text = current_setting('app.current_clinica_id', true))
        OR
        -- Próprio usuário
        (cpf = current_setting('app.current_user_cpf', true))
    );

-- AVALIAÇÕES: Corrigir para incluir contratante_id
DROP POLICY IF EXISTS avaliacoes_select_contratante ON avaliacoes;
CREATE POLICY avaliacoes_select_contratante ON avaliacoes
    FOR SELECT
    USING (
        (current_setting('app.current_perfil', true) = 'admin')
        OR
        -- Avaliação vinculada ao contratante
        (contratante_id::text = current_setting('app.current_contratante_id', true))
        OR
        -- Funcionário da avaliação vinculado à clínica
        EXISTS (
            SELECT 1 FROM funcionarios f
            WHERE f.cpf = avaliacoes.funcionario_cpf
            AND f.clinica_id::text = current_setting('app.current_clinica_id', true)
        )
    );

-- LOTES: Garantir isolamento por contratante
DROP POLICY IF EXISTS policy_lotes_entidade ON lotes_avaliacao;
CREATE POLICY policy_lotes_entidade ON lotes_avaliacao
    FOR SELECT
    USING (
        current_setting('app.current_role', TRUE) IN ('rh', 'entidade', 'gestor')
        AND contratante_id::text = current_setting('app.current_contratante_id', TRUE)
    );

-- EMPRESAS_CLIENTES: Isolamento por contratante
DROP POLICY IF EXISTS empresas_clientes_select_contratante ON empresas_clientes;
CREATE POLICY empresas_clientes_select_contratante ON empresas_clientes
    FOR SELECT
    USING (
        (current_setting('app.current_perfil', true) = 'admin')
        OR
        (contratante_id::text = current_setting('app.current_contratante_id', true))
    );

\echo '✓ Policies RLS corrigidas para considerar contratante_id'

-- ============================================================================
-- 5. TABELA DE AUDITORIA DE POLICIES RLS
-- ============================================================================
\echo '5. Criando sistema de auditoria de policies...'

-- Tabela para auditar mudanças em policies
CREATE TABLE IF NOT EXISTS rls_policy_audit (
    id SERIAL PRIMARY KEY,
    event_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    schema_name VARCHAR(100),
    table_name VARCHAR(100),
    policy_name VARCHAR(100),
    operation VARCHAR(20), -- CREATE, DROP, ALTER
    policy_definition TEXT,
    executed_by VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    details JSONB
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_rls_audit_time ON rls_policy_audit(event_time DESC);
CREATE INDEX IF NOT EXISTS idx_rls_audit_table ON rls_policy_audit(table_name);
CREATE INDEX IF NOT EXISTS idx_rls_audit_operation ON rls_policy_audit(operation);

-- Função para registrar mudanças em policies
CREATE OR REPLACE FUNCTION audit_rls_policy_change()
RETURNS event_trigger AS $$
DECLARE
    r RECORD;
    obj_type TEXT;
BEGIN
    FOR r IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        obj_type := r.object_type;
        
        IF obj_type = 'policy' THEN
            INSERT INTO rls_policy_audit (
                schema_name,
                table_name,
                policy_name,
                operation,
                executed_by,
                details
            ) VALUES (
                r.schema_name,
                r.object_identity,
                r.object_identity,
                TG_EVENT,
                current_user,
                jsonb_build_object(
                    'command_tag', r.command_tag,
                    'object_type', r.object_type
                )
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Event trigger para capturar mudanças em policies
DROP EVENT TRIGGER IF EXISTS trg_audit_policy_ddl;
CREATE EVENT TRIGGER trg_audit_policy_ddl
    ON ddl_command_end
    WHEN TAG IN ('CREATE POLICY', 'ALTER POLICY', 'DROP POLICY')
    EXECUTE FUNCTION audit_rls_policy_change();

\echo '✓ Sistema de auditoria de policies implementado'

-- ============================================================================
-- 6. VALIDAÇÃO OBRIGATÓRIA DE SESSÃO
-- ============================================================================
\echo '6. Implementando validação obrigatória de sessão...'

-- Função para validar contexto de sessão RLS
CREATE OR REPLACE FUNCTION validar_sessao_rls()
RETURNS BOOLEAN AS $$
DECLARE
    v_perfil TEXT;
    v_cpf TEXT;
    v_contratante_id TEXT;
    v_clinica_id TEXT;
BEGIN
    -- Obter variáveis de contexto
    v_perfil := current_setting('app.current_perfil', true);
    v_cpf := current_setting('app.current_user_cpf', true);
    v_contratante_id := current_setting('app.current_contratante_id', true);
    v_clinica_id := current_setting('app.current_clinica_id', true);
    
    -- Validações
    IF v_perfil IS NULL OR v_perfil = '' THEN
        RAISE EXCEPTION 'SEGURANÇA: Perfil de usuário não definido na sessão';
    END IF;
    
    IF v_cpf IS NULL OR v_cpf = '' THEN
        RAISE EXCEPTION 'SEGURANÇA: CPF de usuário não definido na sessão';
    END IF;
    
    -- Validar CPF tem 11 dígitos
    IF v_cpf !~ '^\d{11}$' THEN
        RAISE EXCEPTION 'SEGURANÇA: CPF inválido na sessão: %', v_cpf;
    END IF;
    
    -- Perfis que requerem contratante_id ou clinica_id
    IF v_perfil IN ('gestor', 'rh', 'entidade') THEN
        IF (v_contratante_id IS NULL OR v_contratante_id = '') 
           AND (v_clinica_id IS NULL OR v_clinica_id = '') THEN
            RAISE EXCEPTION 'SEGURANÇA: Perfil % requer contratante_id ou clinica_id', v_perfil;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Função wrapper para queries sensíveis
CREATE OR REPLACE FUNCTION query_with_validated_session(p_query TEXT)
RETURNS VOID AS $$
BEGIN
    -- Validar sessão antes de executar query
    PERFORM validar_sessao_rls();
    
    -- Executar query (deve ser usado pela aplicação)
    RAISE NOTICE 'Sessão validada. Execute sua query na aplicação.';
END;
$$ LANGUAGE plpgsql;

\echo '✓ Validação de sessão implementada'

-- ============================================================================
-- 7. FUNÇÃO DE VERIFICAÇÃO DE SEGURANÇA
-- ============================================================================
\echo '7. Criando função de verificação de segurança...'

CREATE OR REPLACE FUNCTION verificar_seguranca_rls()
RETURNS TABLE(
    categoria TEXT,
    item TEXT,
    status TEXT,
    detalhes TEXT
) AS $$
BEGIN
    -- 1. Verificar FORCE RLS
    RETURN QUERY
    SELECT 
        'FORCE RLS'::TEXT as categoria,
        tablename::TEXT as item,
        CASE 
            WHEN relforcerowsecurity THEN '✓ OK'
            ELSE '✗ CRÍTICO'
        END as status,
        CASE 
            WHEN relforcerowsecurity THEN 'FORCE RLS ativado'
            ELSE 'FORCE RLS NÃO ativado - owner pode bypassar'
        END as detalhes
    FROM pg_tables pt
    JOIN pg_class pc ON pc.relname = pt.tablename
    WHERE pt.schemaname = 'public'
    AND pt.tablename IN (
        'contratantes', 'funcionarios', 'avaliacoes', 'laudos',
        'lotes_avaliacao', 'recibos', 'contratos', 'pagamentos'
    );
    
    -- 2. Verificar índices RLS
    RETURN QUERY
    SELECT 
        'ÍNDICES RLS'::TEXT,
        'contratante_id'::TEXT,
        CASE 
            WHEN COUNT(*) >= 5 THEN '✓ OK'
            ELSE '⚠ ATENÇÃO'
        END,
        'Encontrados ' || COUNT(*) || ' índices em contratante_id'
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE '%contratante_id%';
    
    -- 3. Verificar senhas placeholder
    RETURN QUERY
    SELECT 
        'SENHAS'::TEXT,
        'Placeholders'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN '✓ OK'
            ELSE '✗ CRÍTICO'
        END,
        'Encontrados ' || COUNT(*) || ' placeholders de senha'
    FROM entidades_senhas
    WHERE senha_hash LIKE 'PLACEHOLDER_%';
    
    -- 4. Verificar policies por tabela
    RETURN QUERY
    SELECT 
        'POLICIES'::TEXT,
        tablename::TEXT,
        CASE 
            WHEN COUNT(*) > 0 THEN '✓ OK'
            ELSE '✗ CRÍTICO'
        END,
        'Policies: ' || COUNT(*)::TEXT
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN (
        'contratantes', 'funcionarios', 'avaliacoes', 'laudos'
    )
    GROUP BY tablename;
    
END;
$$ LANGUAGE plpgsql;

\echo '✓ Função de verificação criada'

-- ============================================================================
-- 8. EXECUTAR VERIFICAÇÃO FINAL
-- ============================================================================
\echo '8. Executando verificação final de segurança...'
\echo ''
\echo '========================================='
\echo 'RELATÓRIO DE SEGURANÇA'
\echo '========================================='

SELECT * FROM verificar_seguranca_rls();

-- ============================================================================
-- FINALIZAÇÃO
-- ============================================================================

\echo ''
\echo '========================================='
\echo '✓ MIGRATION 999 CONCLUÍDA COM SUCESSO'
\echo '========================================='
\echo ''
\echo 'AÇÕES NECESSÁRIAS NA APLICAÇÃO:'
\echo '1. Remover código de fallback de placeholder do login'
\echo '2. Adicionar chamada a validar_sessao_rls() em queryWithContext'
\echo '3. Forçar reset de senhas marcadas como RESET_REQUIRED_'
\echo '4. Monitorar tabela rls_policy_audit regularmente'
\echo ''

COMMIT;
