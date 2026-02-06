-- ==========================================
-- MIGRAÇÃO 030: PROTEÇÃO CRÍTICA PARA SENHAS
-- Data: 2025-12-23
-- Objetivo: IMPEDIR que senhas sejam deletadas acidentalmente
-- Nota: Tabela 'entidades_senhas' renomeada para 'entidades_senhas' na Migration 420
-- ==========================================

BEGIN;

-- ==========================================
-- 1. CRIAR TABELA DE AUDITORIA PARA SENHAS
-- ==========================================
-- Nota: Mantém nome '_audit' compatível com nome da tabela original

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        CREATE TABLE IF NOT EXISTS entidades_senhas_audit (
            audit_id SERIAL PRIMARY KEY,
            operacao VARCHAR(10) NOT NULL,
            entidade_id INTEGER NOT NULL,
            cpf VARCHAR(11) NOT NULL,
            senha_hash_anterior VARCHAR(255),
            senha_hash_nova VARCHAR(255),
            executado_por VARCHAR(100),
            executado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ip_origem VARCHAR(50),
            motivo TEXT,
            CONSTRAINT chk_operacao CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE'))
        );
        
        CREATE INDEX IF NOT EXISTS idx_senhas_audit_entidade ON entidades_senhas_audit(entidade_id);
        CREATE INDEX IF NOT EXISTS idx_senhas_audit_data ON entidades_senhas_audit(executado_em);
        CREATE INDEX IF NOT EXISTS idx_senhas_audit_operacao ON entidades_senhas_audit(operacao);
        
        COMMENT ON TABLE entidades_senhas_audit IS 'Auditoria completa de todas as operações na tabela entidades_senhas - NUNCA DELETE DESTA TABELA';
        COMMENT ON COLUMN entidades_senhas_audit.operacao IS 'Tipo de operação: INSERT, UPDATE ou DELETE';
        COMMENT ON COLUMN entidades_senhas_audit.senha_hash_anterior IS 'Hash da senha antes da operação (NULL para INSERT)';
        COMMENT ON COLUMN entidades_senhas_audit.senha_hash_nova IS 'Hash da senha após a operação (NULL para DELETE)';
        
        RAISE NOTICE 'Tabela entidades_senhas_audit criada';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        CREATE TABLE IF NOT EXISTS entidades_senhas_audit (
            audit_id SERIAL PRIMARY KEY,
            operacao VARCHAR(10) NOT NULL,
            contratante_id INTEGER NOT NULL,
            cpf VARCHAR(11) NOT NULL,
            senha_hash_anterior VARCHAR(255),
            senha_hash_nova VARCHAR(255),
            executado_por VARCHAR(100),
            executado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ip_origem VARCHAR(50),
            motivo TEXT,
            CONSTRAINT chk_operacao CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE'))
        );
        
        CREATE INDEX IF NOT EXISTS idx_senhas_audit_contratante ON entidades_senhas_audit(contratante_id);
        CREATE INDEX IF NOT EXISTS idx_senhas_audit_data ON entidades_senhas_audit(executado_em);
        CREATE INDEX IF NOT EXISTS idx_senhas_audit_operacao ON entidades_senhas_audit(operacao);
        
        COMMENT ON TABLE entidades_senhas_audit IS 'Auditoria completa de todas as operações na tabela entidades_senhas - Será renomeada na Migration 420';
        COMMENT ON COLUMN entidades_senhas_audit.operacao IS 'Tipo de operação: INSERT, UPDATE ou DELETE';
        COMMENT ON COLUMN entidades_senhas_audit.senha_hash_anterior IS 'Hash da senha antes da operação (NULL para INSERT)';
        COMMENT ON COLUMN entidades_senhas_audit.senha_hash_nova IS 'Hash da senha após a operação (NULL para DELETE)';
        
        RAISE NOTICE 'Tabela entidades_senhas_audit criada (será migrada na Migration 420)';
    END IF;
END $$;

-- ==========================================
-- 2. CRIAR FUNÇÃO DE AUDITORIA AUTOMÁTICA (ADAPTATIVA)
-- ==========================================
-- Nota: Função criada dinamicamente para funcionar com ambos os nomes de tabela

DO $$
DECLARE
    v_table_name TEXT;
    v_audit_table_name TEXT;
    v_id_column_name TEXT;
    v_function_body TEXT;
BEGIN
    -- Detectar qual tabela existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        v_table_name := 'entidades_senhas';
        v_audit_table_name := 'entidades_senhas_audit';
        v_id_column_name := 'entidade_id';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        v_table_name := 'entidades_senhas';
        v_audit_table_name := 'entidades_senhas_audit';
        v_id_column_name := 'contratante_id';
    ELSE
        RAISE EXCEPTION 'Nenhuma tabela de senhas (entidades_senhas ou entidades_senhas) encontrada';
    END IF;

    -- Criar função adaptativa
    EXECUTE format('
    CREATE OR REPLACE FUNCTION fn_audit_senhas()
    RETURNS TRIGGER AS $func$
    BEGIN
        -- Registrar INSERT
        IF TG_OP = ''INSERT'' THEN
            INSERT INTO %I (
                operacao,
                %I,
                cpf,
                senha_hash_anterior,
                senha_hash_nova,
                executado_por,
                motivo
            ) VALUES (
                ''INSERT'',
                NEW.%I,
                NEW.cpf,
                NULL,
                NEW.senha_hash,
                current_user,
                ''Nova senha criada''
            );
            RETURN NEW;
        
        -- Registrar UPDATE
        ELSIF TG_OP = ''UPDATE'' THEN
            INSERT INTO %I (
                operacao,
                %I,
                cpf,
                senha_hash_anterior,
                senha_hash_nova,
                executado_por,
                motivo
            ) VALUES (
                ''UPDATE'',
                NEW.%I,
                NEW.cpf,
                OLD.senha_hash,
                NEW.senha_hash,
                current_user,
                CASE 
                    WHEN OLD.senha_hash != NEW.senha_hash THEN ''Senha alterada''
                    ELSE ''Dados atualizados''
                END
            );
            RETURN NEW;
        
        -- Registrar DELETE (e BLOQUEAR!)
        ELSIF TG_OP = ''DELETE'' THEN
            -- PROTEÇÃO CRÍTICA: Verificar se a deleção está autorizada
            IF current_setting(''app.allow_senha_delete'', true) IS NULL 
               OR current_setting(''app.allow_senha_delete'', true) != ''true'' THEN
                
                -- Registrar tentativa bloqueada
                INSERT INTO %I (
                    operacao,
                    %I,
                    cpf,
                    senha_hash_anterior,
                    senha_hash_nova,
                    executado_por,
                    motivo
                ) VALUES (
                    ''DELETE'',
                    OLD.%I,
                    OLD.cpf,
                    OLD.senha_hash,
                    NULL,
                    current_user,
                    ''TENTATIVA BLOQUEADA: Delete não autorizado''
                );
                
                RAISE EXCEPTION ''OPERAÇÃO BLOQUEADA: Delete de senhas requer autorização explícita. Use fn_delete_senha_autorizado() para deletar senhas com segurança.'';
            END IF;
            
            -- Se chegou aqui, está autorizado - registrar
            INSERT INTO %I (
                operacao,
                %I,
                cpf,
                senha_hash_anterior,
                senha_hash_nova,
                executado_por,
                motivo
            ) VALUES (
                ''DELETE'',
                OLD.%I,
                OLD.cpf,
                OLD.senha_hash,
                NULL,
                current_user,
                ''Delete autorizado via função segura''
            );
            RETURN OLD;
        END IF;
        
        RETURN NULL;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
    ', 
    v_audit_table_name, v_id_column_name, v_id_column_name,  -- INSERT
    v_audit_table_name, v_id_column_name, v_id_column_name,  -- UPDATE
    v_audit_table_name, v_id_column_name, v_id_column_name,  -- DELETE bloqueado
    v_audit_table_name, v_id_column_name, v_id_column_name   -- DELETE autorizado
    );
    
    RAISE NOTICE 'Função fn_audit_senhas() criada para tabela %', v_table_name;
END $$;

COMMENT ON FUNCTION fn_audit_senhas() IS 'Audita e BLOQUEIA operacoes nao autorizadas em senhas (adaptativa para entidades_senhas/entidades_senhas)';

-- ==========================================
-- 3. CRIAR TRIGGER DE PROTEÇÃO (ADAPTATIVO)
-- ==========================================

DO $$
DECLARE
    v_table_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        v_table_name := 'entidades_senhas';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        v_table_name := 'entidades_senhas';
    ELSE
        RAISE EXCEPTION 'Tabela de senhas não encontrada';
    END IF;

    EXECUTE format('DROP TRIGGER IF EXISTS trg_protect_senhas ON %I', v_table_name);
    
    EXECUTE format('
        CREATE TRIGGER trg_protect_senhas
            BEFORE INSERT OR UPDATE OR DELETE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION fn_audit_senhas()
    ', v_table_name);
    
    RAISE NOTICE 'Trigger trg_protect_senhas criado em %', v_table_name;
END $$;

-- Manter comentário na tabela atual
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        EXECUTE 'COMMENT ON TRIGGER trg_protect_senhas ON entidades_senhas IS ''CRITICO: Protege contra delecao acidental de senhas e audita todas as operacoes''';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        EXECUTE 'COMMENT ON TRIGGER trg_protect_senhas ON entidades_senhas IS ''CRITICO: Protege contra delecao acidental de senhas e audita todas as operacoes''';
    END IF;
END $$;

-- ==========================================
-- 4. CRIAR FUNÇÃO SEGURA PARA DELETAR SENHAS (ADAPTATIVA)
-- ==========================================

CREATE OR REPLACE FUNCTION fn_delete_senha_autorizado(
    p_entidade_id INTEGER,
    p_motivo TEXT DEFAULT 'Não especificado'
)
RETURNS VOID AS $$
DECLARE
    v_table_name TEXT;
    v_id_column TEXT;
BEGIN
    -- Detectar tabela e coluna corretas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        v_table_name := 'entidades_senhas';
        v_id_column := 'entidade_id';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        v_table_name := 'entidades_senhas';
        v_id_column := 'contratante_id';
    ELSE
        RAISE EXCEPTION 'Tabela de senhas não encontrada';
    END IF;

    -- Validar motivo
    IF p_motivo IS NULL OR TRIM(p_motivo) = '' THEN
        RAISE EXCEPTION 'Motivo da deleção é obrigatório';
    END IF;
    
    -- Log de segurança
    RAISE NOTICE 'ATENÇÃO: Deletando senha da entidade % com motivo: %', p_entidade_id, p_motivo;
    
    -- Habilitar deleção temporariamente
    PERFORM set_config('app.allow_senha_delete', 'true', true);
    
    -- Executar delete na tabela correta
    EXECUTE format('DELETE FROM %I WHERE %I = $1', v_table_name, v_id_column) 
    USING p_entidade_id;
    
    -- Desabilitar deleção
    PERFORM set_config('app.allow_senha_delete', 'false', true);
    
    RAISE NOTICE 'Senha deletada com sucesso. Operação registrada em auditoria';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_delete_senha_autorizado(INTEGER, TEXT) IS 'UNICA forma segura de deletar senhas - requer motivo e registra em auditoria (adaptativa para entidades/contratantes)';

-- ==========================================
-- 5. CRIAR FUNÇÃO PARA LIMPAR SENHAS DE TESTE (ADAPTATIVA)
-- ==========================================

CREATE OR REPLACE FUNCTION fn_limpar_senhas_teste()
RETURNS VOID AS $$
DECLARE
    v_count INTEGER;
    v_table_name TEXT;
BEGIN
    -- Esta função pode ser usada apenas em ambiente de desenvolvimento
    IF current_database() = 'nr-bps_db' THEN
        RAISE EXCEPTION 'BLOQUEADO: Esta função não pode ser executada no banco de produção!';
    END IF;
    
    -- Detectar tabela correta
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        v_table_name := 'entidades_senhas';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        v_table_name := 'entidades_senhas';
    ELSE
        RAISE EXCEPTION 'Tabela de senhas não encontrada';
    END IF;
    
    -- Habilitar deleção
    PERFORM set_config('app.allow_senha_delete', 'true', true);
    
    -- Contar senhas que serão deletadas
    EXECUTE format('SELECT COUNT(*) FROM %I', v_table_name) INTO v_count;
    
    RAISE NOTICE 'Limpando % senhas de teste...', v_count;
    
    -- Deletar todas as senhas
    EXECUTE format('DELETE FROM %I', v_table_name);
    
    -- Desabilitar deleção
    PERFORM set_config('app.allow_senha_delete', 'false', true);
    
    RAISE NOTICE 'Senhas de teste deletadas. Todas as operações foram auditadas.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_limpar_senhas_teste() IS 'APENAS PARA TESTES: Limpa senhas em ambiente de teste (adaptativa)';

-- ==========================================
-- 6. CRIAR VIEW DE AUDITORIA (ADAPTATIVA)
-- ==========================================

DO $$
DECLARE
    v_table_name TEXT;
    v_audit_table TEXT;
    v_id_column TEXT;
    v_entity_table TEXT;
BEGIN
    -- Detectar nomes corretos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        v_audit_table := 'entidades_senhas_audit';
        v_id_column := 'entidade_id';
        v_entity_table := 'entidades';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
        v_audit_table := 'entidades_senhas_audit';
        v_id_column := 'contratante_id';
        v_entity_table := 'contratantes';
    ELSE
        RAISE EXCEPTION 'Tabela de auditoria de senhas não encontrada';
    END IF;

    EXECUTE format('
    CREATE OR REPLACE VIEW vw_auditoria_senhas AS
    SELECT 
        a.audit_id,
        a.operacao,
        e.nome AS entidade_nome,
        e.cnpj,
        a.cpf,
        a.senha_hash_anterior IS NOT NULL AS tinha_senha_anterior,
        a.senha_hash_nova IS NOT NULL AS tem_senha_nova,
        a.executado_por,
        a.executado_em,
        a.motivo,
        CASE 
            WHEN a.motivo LIKE ''%%BLOQUEADA%%'' THEN ''TENTATIVA_BLOQUEADA''
            WHEN a.operacao = ''DELETE'' THEN ''DELETE_AUTORIZADO''
            ELSE ''NORMAL''
        END AS tipo_operacao
    FROM %I a
    LEFT JOIN %I e ON e.id = a.%I
    ORDER BY a.executado_em DESC
    ', v_audit_table, v_entity_table, v_id_column);
    
    RAISE NOTICE 'View vw_auditoria_senhas criada';
END $$;

COMMENT ON VIEW vw_auditoria_senhas IS 'View simplificada para análise de auditoria de senhas (adaptativa para entidades/contratantes)';

-- ==========================================
-- 7. CONCEDER PERMISSÕES (ADAPTATIVO)
-- ==========================================

-- Apenas postgres pode deletar diretamente da tabela de auditoria
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas_audit') THEN
        REVOKE ALL ON entidades_senhas_audit FROM PUBLIC;
        GRANT SELECT ON entidades_senhas_audit TO PUBLIC;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas_audit') THEN
        REVOKE ALL ON entidades_senhas_audit FROM PUBLIC;
        GRANT SELECT ON entidades_senhas_audit TO PUBLIC;
    END IF;
END $$;

-- View de auditoria pode ser acessada por todos
GRANT SELECT ON vw_auditoria_senhas TO PUBLIC;

-- ==========================================
-- 8. LOG DE SUCESSO
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PROTEÇÃO DE SENHAS IMPLEMENTADA COM SUCESSO';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Proteções ativas:';
    RAISE NOTICE '1. ✓ Trigger bloqueia DELETE direto';
    RAISE NOTICE '2. ✓ Auditoria automática de todas as operações';
    RAISE NOTICE '3. ✓ Função segura: fn_delete_senha_autorizado()';
    RAISE NOTICE '4. ✓ Função de teste: fn_limpar_senhas_teste()';
    RAISE NOTICE '5. ✓ View de auditoria: vw_auditoria_senhas';
    RAISE NOTICE '';
    RAISE NOTICE 'Para deletar uma senha agora:';
    RAISE NOTICE '  SELECT fn_delete_senha_autorizado(entidade_id, ''motivo'');';
    RAISE NOTICE '';
    RAISE NOTICE 'Ver auditoria:';
    RAISE NOTICE '  SELECT * FROM vw_auditoria_senhas LIMIT 10;';
    RAISE NOTICE '';
    RAISE NOTICE 'Nota: Funções adaptativas funcionam com ambas';
    RAISE NOTICE '      entidades_senhas e entidades_senhas';
    RAISE NOTICE '========================================';
END $$;

COMMIT;
