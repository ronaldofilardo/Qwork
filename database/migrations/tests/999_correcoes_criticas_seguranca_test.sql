-- ============================================================================
-- Migration 999 TESTE: Correções Críticas de Segurança (Versão Teste)
-- Data: 2026-01-30
-- Descrição: Versão adaptada para banco de testes
-- ============================================================================

BEGIN;

\echo '========================================='
\echo 'MIGRATION 999 TEST: CORREÇÕES DE SEGURANÇA'
\echo '========================================='

-- ============================================================================
-- 1. PROTEÇÃO CONTRA PLACEHOLDER (função e trigger)
-- ============================================================================
\echo '1. Criando proteção contra placeholders...'

CREATE OR REPLACE FUNCTION prevenir_placeholder_senha()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.senha_hash LIKE 'PLACEHOLDER_%' THEN
        RAISE EXCEPTION 'SEGURANÇA: Placeholders de senha não são permitidos';
    END IF;
    
    IF LENGTH(NEW.senha_hash) < 50 AND NEW.senha_hash NOT LIKE 'RESET_REQUIRED_%' THEN
        RAISE EXCEPTION 'SEGURANÇA: Senha deve ser hasheada com bcrypt';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevenir_placeholder_senha ON contratantes_senhas;
CREATE TRIGGER trg_prevenir_placeholder_senha
    BEFORE INSERT OR UPDATE ON contratantes_senhas
    FOR EACH ROW
    EXECUTE FUNCTION prevenir_placeholder_senha();

\echo 'OK Protecao contra placeholders implementada'

-- ============================================================================
-- 2. FORCE ROW LEVEL SECURITY
-- ============================================================================
\echo '2. Aplicando FORCE RLS...'

ALTER TABLE contratantes FORCE ROW LEVEL SECURITY;
ALTER TABLE contratantes_senhas FORCE ROW LEVEL SECURITY;
ALTER TABLE funcionarios FORCE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes FORCE ROW LEVEL SECURITY;
ALTER TABLE resultados FORCE ROW LEVEL SECURITY;
ALTER TABLE laudos FORCE ROW LEVEL SECURITY;
ALTER TABLE lotes_avaliacao FORCE ROW LEVEL SECURITY;
ALTER TABLE pagamentos FORCE ROW LEVEL SECURITY;
ALTER TABLE recibos FORCE ROW LEVEL SECURITY;
ALTER TABLE contratos FORCE ROW LEVEL SECURITY;
ALTER TABLE empresas_clientes FORCE ROW LEVEL SECURITY;

\echo 'OK FORCE RLS aplicado'

-- ============================================================================
-- 3. ÍNDICES BÁSICOS PARA RLS (apenas os que existem no schema)
-- ============================================================================
\echo '3. Criando índices RLS...'

-- Só criar índices se as colunas existirem
DO $$
BEGIN
    -- funcionarios.clinica_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='funcionarios' AND column_name='clinica_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_funcionarios_clinica_id_rls
            ON funcionarios(clinica_id) WHERE clinica_id IS NOT NULL;
    END IF;
    
    -- funcionarios.cpf
    CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf_rls ON funcionarios(cpf);
    
    -- avaliacoes.funcionario_cpf
    CREATE INDEX IF NOT EXISTS idx_avaliacoes_funcionario_cpf_rls 
        ON avaliacoes(funcionario_cpf);
END$$;

\echo 'OK Indices RLS criados'

-- ============================================================================
-- 4. AUDITORIA DE POLICIES
-- ============================================================================
\echo '4. Criando sistema de auditoria...'

CREATE TABLE IF NOT EXISTS rls_policy_audit (
    id SERIAL PRIMARY KEY,
    event_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    schema_name VARCHAR(100),
    table_name VARCHAR(100),
    policy_name VARCHAR(100),
    operation VARCHAR(20),
    policy_definition TEXT,
    executed_by VARCHAR(100),
    details JSONB
);

CREATE INDEX IF NOT EXISTS idx_rls_audit_time ON rls_policy_audit(event_time DESC);

-- Função de auditoria simplificada (sem event trigger por limitações de permissão)
CREATE OR REPLACE FUNCTION audit_rls_policy_change()
RETURNS event_trigger AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        IF r.object_type = 'policy' THEN
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
                jsonb_build_object('command_tag', r.command_tag)
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

\echo 'OK Sistema de auditoria criado'

-- ============================================================================
-- 5. VALIDAÇÃO DE SESSÃO
-- ============================================================================
\echo '5. Criando validação de sessão...'

CREATE OR REPLACE FUNCTION validar_sessao_rls()
RETURNS BOOLEAN AS $$
DECLARE
    v_perfil TEXT;
    v_cpf TEXT;
BEGIN
    v_perfil := current_setting('app.current_perfil', true);
    v_cpf := current_setting('app.current_user_cpf', true);
    
    IF v_perfil IS NULL OR v_perfil = '' THEN
        RAISE EXCEPTION 'SEGURANÇA: Perfil de usuário não definido na sessão';
    END IF;
    
    IF v_cpf IS NULL OR v_cpf = '' THEN
        RAISE EXCEPTION 'SEGURANÇA: CPF de usuário não definido na sessão';
    END IF;
    
    IF v_cpf !~ '^\d{11}$' THEN
        RAISE EXCEPTION 'SEGURANÇA: CPF inválido na sessão: %', v_cpf;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

\echo 'OK Validacao de sessao implementada'

-- ============================================================================
-- 6. FUNÇÃO DE VERIFICAÇÃO
-- ============================================================================
\echo '6. Criando verificação de segurança...'

CREATE OR REPLACE FUNCTION verificar_seguranca_rls()
RETURNS TABLE(
    categoria TEXT,
    item TEXT,
    status TEXT,
    detalhes TEXT
) AS $$
BEGIN
    -- Verificar FORCE RLS
    RETURN QUERY
    SELECT 
        'FORCE RLS'::TEXT,
        tablename::TEXT,
        CASE WHEN relforcerowsecurity THEN 'OK' ELSE 'CRITICO' END,
        CASE WHEN relforcerowsecurity THEN 'FORCE RLS ativado'
             ELSE 'FORCE RLS NAO ativado' END
    FROM pg_tables pt
    JOIN pg_class pc ON pc.relname = pt.tablename
    WHERE pt.schemaname = 'public'
    AND pt.tablename IN ('contratantes', 'funcionarios', 'avaliacoes');
    
    -- Verificar senhas placeholder
    RETURN QUERY
    SELECT 
        'SENHAS'::TEXT,
        'Placeholders'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'CRITICO' END,
        'Placeholders: ' || COUNT(*)::TEXT
    FROM contratantes_senhas
    WHERE senha_hash LIKE 'PLACEHOLDER_%';
    
    -- Verificar funções
    RETURN QUERY
    SELECT 
        'FUNCOES'::TEXT,
        proname::TEXT,
        'OK'::TEXT,
        'Funcao implementada'::TEXT
    FROM pg_proc
    WHERE proname IN ('validar_sessao_rls', 'prevenir_placeholder_senha')
    AND pronamespace = 'public'::regnamespace;
END;
$$ LANGUAGE plpgsql;

\echo 'OK Verificacao implementada'

-- ============================================================================
-- 7. EXECUTAR VERIFICAÇÃO
-- ============================================================================
\echo ''
\echo '========================================='
\echo 'RELATÓRIO DE SEGURANÇA'
\echo '========================================='

SELECT * FROM verificar_seguranca_rls();

\echo ''
\echo '========================================='
\echo 'OK MIGRATION 999 TEST CONCLUIDA'
\echo '========================================='

COMMIT;
