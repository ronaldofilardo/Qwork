-- ================================================================
-- SCRIPT DE MIGRAÇÃO - APLICAÇÃO DE POLÍTICAS RLS REVISADAS
-- ================================================================
-- Data: 11/12/2025
-- Descrição: Aplica as novas políticas RLS e mecanismos de imutabilidade
-- ATENÇÃO: Execute este script em horário de baixo movimento
-- ================================================================

BEGIN;

-- ================================================================
-- ETAPA 1: BACKUP DE SEGURANÇA (VERIFICAÇÃO)
-- ================================================================

DO $$
DECLARE
    v_count_funcionarios INTEGER;
    v_count_avaliacoes INTEGER;
    v_count_resultados INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count_funcionarios FROM funcionarios;
    SELECT COUNT(*) INTO v_count_avaliacoes FROM avaliacoes;
    SELECT COUNT(*) INTO v_count_resultados FROM resultados;

    -- ================================================
    -- CONTAGEM PRÉ-MIGRAÇÃO:
    -- Funcionários: (ver no log do psql)
    -- Avaliações: (ver no log do psql)
    -- Resultados: (ver no log do psql)
    -- ================================================

    -- RECOMENDAÇÃO: Certifique-se de ter um backup antes de continuar!
END $$;

-- ================================================================
-- ETAPA 2: REMOVER POLÍTICAS ANTIGAS DO ADMIN
-- ================================================================

-- Removendo políticas antigas do Admin...

DROP POLICY IF EXISTS "admin_all_funcionarios" ON funcionarios;

DROP POLICY IF EXISTS "admin_all_avaliacoes" ON avaliacoes;

DROP POLICY IF EXISTS "admin_all_empresas" ON empresas_clientes;

DROP POLICY IF EXISTS "admin_all_lotes" ON lotes_avaliacao;

DROP POLICY IF EXISTS "admin_all_laudos" ON laudos;

DROP POLICY IF EXISTS "admin_all_respostas" ON respostas;

DROP POLICY IF EXISTS "admin_all_resultados" ON resultados;

DROP POLICY IF EXISTS "admin_all_clinicas" ON clinicas;

-- Políticas antigas removidas com sucesso.

-- ================================================================
-- ETAPA 3: CRIAR NOVAS POLÍTICAS RESTRITIVAS PARA ADMIN
-- ================================================================

-- Criando novas políticas restritivas para Admin...

-- FUNCIONÁRIOS: Apenas RH e Emissor
CREATE POLICY "admin_restricted_funcionarios" ON funcionarios FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'admin'
    AND perfil IN ('rh', 'emissor')
);

-- EMPRESAS: Permissão completa de gestão
CREATE POLICY "admin_view_empresas" ON empresas_clientes FOR
SELECT USING (
        current_setting (
            'app.current_user_perfil', true
        ) = 'admin'
    );

CREATE POLICY "admin_manage_empresas" ON empresas_clientes FOR
INSERT
WITH
    CHECK (
        current_setting (
            'app.current_user_perfil',
            true
        ) = 'admin'
    );

CREATE POLICY "admin_update_empresas" ON empresas_clientes FOR
UPDATE USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'admin'
);

CREATE POLICY "admin_delete_empresas" ON empresas_clientes FOR DELETE USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'admin'
);

-- CLÍNICAS: Permissão completa
CREATE POLICY "admin_manage_clinicas" ON clinicas FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'admin'
);

-- Novas políticas do Admin criadas com sucesso.

-- ================================================================
-- ================================================================

current_setting ( 'app.current_user_perfil', true );

current_setting ( 'app.current_user_perfil', true );

current_setting ( 'app.current_user_perfil', true );

current_setting ( 'app.current_user_perfil', true );

current_setting ( 'app.current_user_perfil', true );

current_setting ( 'app.current_user_perfil', true );

current_setting ( 'app.current_user_perfil', true );

-- ================================================================
-- ETAPA 5: IMPLEMENTAR IMUTABILIDADE DE RESULTADOS
-- ================================================================

-- Implementando mecanismo de imutabilidade para resultados...

-- Função para verificar imutabilidade de resultados
CREATE OR REPLACE FUNCTION check_resultado_immutability()
RETURNS TRIGGER AS $$
DECLARE
    v_status TEXT;
    v_perfil TEXT;
BEGIN
    v_perfil := current_setting('app.current_user_perfil', true);
    
        RETURN NEW;
    END IF;
    
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        SELECT status INTO v_status
        FROM avaliacoes
        WHERE id = OLD.avaliacao_id;
        
        IF v_status = 'concluida' THEN
            RAISE EXCEPTION 'Não é permitido modificar resultados de avaliações concluídas. Avaliação ID: %', OLD.avaliacao_id
                USING HINT = 'Resultados de avaliações concluídas são imutáveis.',
                      ERRCODE = '23506';
        END IF;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        SELECT status INTO v_status
        FROM avaliacoes
        WHERE id = NEW.avaliacao_id;
        
        IF v_status = 'concluida' THEN
            RAISE EXCEPTION 'Não é permitido adicionar resultados a avaliações já concluídas. Avaliação ID: %', NEW.avaliacao_id
                USING HINT = 'Finalize a avaliação antes de adicionar resultados.',
                      ERRCODE = '23506';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_resultado_immutability ON resultados;

CREATE TRIGGER trigger_resultado_immutability
    BEFORE INSERT OR UPDATE OR DELETE ON resultados
    FOR EACH ROW
    EXECUTE FUNCTION check_resultado_immutability();

-- Imutabilidade de resultados implementada.

-- ================================================================
-- ETAPA 6: IMPLEMENTAR IMUTABILIDADE DE RESPOSTAS
-- ================================================================

-- Implementando mecanismo de imutabilidade para respostas...

-- Função para verificar imutabilidade de respostas
CREATE OR REPLACE FUNCTION check_resposta_immutability()
RETURNS TRIGGER AS $$
DECLARE
    v_status TEXT;
    v_perfil TEXT;
BEGIN
    v_perfil := current_setting('app.current_user_perfil', true);
    
        RETURN NEW;
    END IF;
    
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        SELECT status INTO v_status
        FROM avaliacoes
        WHERE id = OLD.avaliacao_id;
        
        IF v_status = 'concluida' THEN
            RAISE EXCEPTION 'Não é permitido modificar respostas de avaliações concluídas. Avaliação ID: %', OLD.avaliacao_id
                USING HINT = 'Respostas de avaliações concluídas são imutáveis.',
                      ERRCODE = '23506';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_resposta_immutability ON respostas;

CREATE TRIGGER trigger_resposta_immutability
    BEFORE UPDATE OR DELETE ON respostas
    FOR EACH ROW
    EXECUTE FUNCTION check_resposta_immutability();

-- Imutabilidade de respostas implementada.

-- ================================================================
-- ETAPA 7: PROTEGER STATUS DE AVALIAÇÕES CONCLUÍDAS
-- ================================================================

-- Implementando proteção para status de avaliações concluídas...

-- Função para proteger status
CREATE OR REPLACE FUNCTION protect_concluded_avaliacao()
RETURNS TRIGGER AS $$
DECLARE
    v_perfil TEXT;
BEGIN
    v_perfil := current_setting('app.current_user_perfil', true);
    
        RETURN NEW;
    END IF;
    
    IF OLD.status = 'concluida' AND NEW.status != 'concluida' THEN
        RAISE EXCEPTION 'Não é permitido alterar o status de uma avaliação concluída. Avaliação ID: %', OLD.id
            USING HINT = 'Avaliações concluídas não podem ter seu status alterado.',
                  ERRCODE = '23506';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_protect_concluded_avaliacao ON avaliacoes;

CREATE TRIGGER trigger_protect_concluded_avaliacao
    BEFORE UPDATE ON avaliacoes
    FOR EACH ROW
    EXECUTE FUNCTION protect_concluded_avaliacao();

-- Proteção de status implementada.

-- ================================================================
-- ETAPA 8: CRIAR TABELA DE AUDITORIA
-- ================================================================

-- Criando tabela de auditoria...

CREATE TABLE IF NOT EXISTS audit_access_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    perfil TEXT,
    cpf TEXT,
    tabela TEXT,
    operacao TEXT,
    motivo TEXT
);

-- Tabela de auditoria criada.

-- ================================================================
-- ETAPA 9: VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ================================================================

DO $$
DECLARE
    v_count_policies INTEGER;
    v_count_triggers INTEGER;
BEGIN
    -- Contar políticas criadas
    SELECT COUNT(*) INTO v_count_policies
    FROM pg_policies
    WHERE schemaname = 'public'
    
    -- Contar triggers criados
    SELECT COUNT(*) INTO v_count_triggers
    FROM pg_trigger
    WHERE tgname IN (
        'trigger_resultado_immutability',
        'trigger_resposta_immutability',
        'trigger_protect_concluded_avaliacao'
    );

    -- ================================================
    -- VERIFICAÇÃO PÓS-MIGRAÇÃO:
    -- Políticas criadas: (ver no log do psql)
    -- Triggers criados: (ver no log do psql)
    -- ================================================

    IF v_count_policies < 10 THEN
        RAISE WARNING 'ATENÇÃO: Menos políticas que o esperado foram criadas!';
    END IF;

    IF v_count_triggers < 3 THEN
        RAISE WARNING 'ATENÇÃO: Menos triggers que o esperado foram criados!';
    END IF;
END $$;

-- ================================================================
-- ETAPA 10: COMMIT OU ROLLBACK
-- ================================================================

-- Descomente a linha abaixo se quiser fazer rollback para testes
-- ROLLBACK;

-- Se tudo estiver OK, commit
COMMIT;

-- ================================================
-- MIGRAÇÃO CONCLUÍDA COM SUCESSO!
-- ================================================
-- Restrições aplicadas:
-- - Admin: Acesso limitado a RH/Emissor em funcionários
-- - Admin: SEM acesso a avaliações, respostas, resultados
-- - Imutabilidade: Resultados/respostas concluídas protegidos
-- ================================================