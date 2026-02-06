-- ==========================================
-- MIGRAÇÃO 030: PROTEÇÃO CRÍTICA PARA SENHAS
-- Data: 2025-12-23
-- Objetivo: IMPEDIR que senhas sejam deletadas acidentalmente
-- ==========================================

BEGIN;

-- ==========================================
-- 1. CRIAR TABELA DE AUDITORIA PARA SENHAS
-- ==========================================

CREATE TABLE IF NOT EXISTS entidades_senhas_audit (
    audit_id SERIAL PRIMARY KEY,
    operacao VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
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

CREATE INDEX idx_senhas_audit_contratante ON entidades_senhas_audit(contratante_id);
CREATE INDEX idx_senhas_audit_data ON entidades_senhas_audit(executado_em);
CREATE INDEX idx_senhas_audit_operacao ON entidades_senhas_audit(operacao);

COMMENT ON TABLE entidades_senhas_audit IS 'Auditoria completa de todas as operações na tabela entidades_senhas - NUNCA DELETE DESTA TABELA';
COMMENT ON COLUMN entidades_senhas_audit.operacao IS 'Tipo de operação: INSERT, UPDATE ou DELETE';
COMMENT ON COLUMN entidades_senhas_audit.senha_hash_anterior IS 'Hash da senha antes da operação (NULL para INSERT)';
COMMENT ON COLUMN entidades_senhas_audit.senha_hash_nova IS 'Hash da senha após a operação (NULL para DELETE)';

-- ==========================================
-- 2. CRIAR FUNÇÃO DE AUDITORIA AUTOMÁTICA
-- ==========================================

CREATE OR REPLACE FUNCTION fn_audit_entidades_senhas()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar INSERT
    IF TG_OP = 'INSERT' THEN
        INSERT INTO entidades_senhas_audit (
            operacao,
            contratante_id,
            cpf,
            senha_hash_anterior,
            senha_hash_nova,
            executado_por,
            motivo
        ) VALUES (
            'INSERT',
            NEW.contratante_id,
            NEW.cpf,
            NULL,
            NEW.senha_hash,
            current_user,
            'Nova senha criada'
        );
        RETURN NEW;
    
    -- Registrar UPDATE
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO entidades_senhas_audit (
            operacao,
            contratante_id,
            cpf,
            senha_hash_anterior,
            senha_hash_nova,
            executado_por,
            motivo
        ) VALUES (
            'UPDATE',
            NEW.contratante_id,
            NEW.cpf,
            OLD.senha_hash,
            NEW.senha_hash,
            current_user,
            CASE 
                WHEN OLD.senha_hash != NEW.senha_hash THEN 'Senha alterada'
                ELSE 'Dados atualizados'
            END
        );
        RETURN NEW;
    
    -- Registrar DELETE (e BLOQUEAR!)
    ELSIF TG_OP = 'DELETE' THEN
        -- PROTEÇÃO CRÍTICA: Verificar se a deleção está autorizada
        IF current_setting('app.allow_senha_delete', true) IS NULL 
           OR current_setting('app.allow_senha_delete', true) != 'true' THEN
            
            -- Registrar tentativa bloqueada
            INSERT INTO entidades_senhas_audit (
                operacao,
                contratante_id,
                cpf,
                senha_hash_anterior,
                senha_hash_nova,
                executado_por,
                motivo
            ) VALUES (
                'DELETE',
                OLD.contratante_id,
                OLD.cpf,
                OLD.senha_hash,
                NULL,
                current_user,
                'TENTATIVA BLOQUEADA: Delete não autorizado'
            );
            
            RAISE EXCEPTION 'OPERAÇÃO BLOQUEADA: Delete de senhas requer autorização explícita. Use fn_delete_senha_autorizado() para deletar senhas com segurança.';
        END IF;
        
        -- Se chegou aqui, está autorizado - registrar
        INSERT INTO entidades_senhas_audit (
            operacao,
            contratante_id,
            cpf,
            senha_hash_anterior,
            senha_hash_nova,
            executado_por,
            motivo
        ) VALUES (
            'DELETE',
            OLD.contratante_id,
            OLD.cpf,
            OLD.senha_hash,
            NULL,
            current_user,
            'Delete autorizado via função segura'
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_audit_entidades_senhas() IS 'Audita e BLOQUEIA operacoes nao autorizadas em entidades_senhas';

-- ==========================================
-- 3. CRIAR TRIGGER DE PROTEÇÃO
-- ==========================================

DROP TRIGGER IF EXISTS trg_protect_senhas ON entidades_senhas;

CREATE TRIGGER trg_protect_senhas
    BEFORE INSERT OR UPDATE OR DELETE ON entidades_senhas
    FOR EACH ROW
    EXECUTE FUNCTION fn_audit_entidades_senhas();

COMMENT ON TRIGGER trg_protect_senhas ON entidades_senhas IS 'CRITICO: Protege contra delecao acidental de senhas e audita todas as operacoes';

-- ==========================================
-- 4. CRIAR FUNÇÃO SEGURA PARA DELETAR SENHAS
-- ==========================================

CREATE OR REPLACE FUNCTION fn_delete_senha_autorizado(
    p_contratante_id INTEGER,
    p_motivo TEXT DEFAULT 'Não especificado'
)
RETURNS VOID AS $$
BEGIN
    -- Validar motivo
    IF p_motivo IS NULL OR TRIM(p_motivo) = '' THEN
        RAISE EXCEPTION 'Motivo da deleção é obrigatório';
    END IF;
    
    -- Log de segurança
    RAISE NOTICE 'ATENÇÃO: Deletando senha do contratante % com motivo: %', p_contratante_id, p_motivo;
    
    -- Habilitar deleção temporariamente
    PERFORM set_config('app.allow_senha_delete', 'true', true);
    
    -- Executar delete
    DELETE FROM entidades_senhas WHERE contratante_id = p_contratante_id;
    
    -- Desabilitar deleção
    PERFORM set_config('app.allow_senha_delete', 'false', true);
    
    RAISE NOTICE 'Senha deletada com sucesso. Operação registrada em entidades_senhas_audit';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_delete_senha_autorizado(INTEGER, TEXT) IS 'UNICA forma segura de deletar senhas - requer motivo e registra em auditoria';

-- ==========================================
-- 5. CRIAR FUNÇÃO PARA LIMPAR SENHAS DE TESTE
-- ==========================================

CREATE OR REPLACE FUNCTION fn_limpar_senhas_teste()
RETURNS VOID AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Esta função pode ser usada apenas em ambiente de desenvolvimento
    IF current_database() = 'nr-bps_db' THEN
        RAISE EXCEPTION 'BLOQUEADO: Esta função não pode ser executada no banco de produção!';
    END IF;
    
    -- Habilitar deleção
    PERFORM set_config('app.allow_senha_delete', 'true', true);
    
    -- Contar senhas que serão deletadas
    SELECT COUNT(*) INTO v_count FROM entidades_senhas;
    
    RAISE NOTICE 'Limpando % senhas de teste...', v_count;
    
    -- Deletar todas as senhas
    DELETE FROM entidades_senhas;
    
    -- Desabilitar deleção
    PERFORM set_config('app.allow_senha_delete', 'false', true);
    
    RAISE NOTICE 'Senhas de teste deletadas. Todas as operações foram auditadas.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_limpar_senhas_teste() IS 'APENAS PARA TESTES: Limpa senhas em ambiente de teste';

-- ==========================================
-- 6. CRIAR VIEW DE AUDITORIA
-- ==========================================

CREATE OR REPLACE VIEW vw_auditoria_senhas AS
SELECT 
    a.audit_id,
    a.operacao,
    c.nome AS contratante_nome,
    c.cnpj,
    a.cpf,
    a.senha_hash_anterior IS NOT NULL AS tinha_senha_anterior,
    a.senha_hash_nova IS NOT NULL AS tem_senha_nova,
    a.executado_por,
    a.executado_em,
    a.motivo,
    CASE 
        WHEN a.motivo LIKE '%BLOQUEADA%' THEN 'TENTATIVA_BLOQUEADA'
        WHEN a.operacao = 'DELETE' THEN 'DELETE_AUTORIZADO'
        ELSE 'NORMAL'
    END AS tipo_operacao
FROM entidades_senhas_audit a
LEFT JOIN contratantes c ON c.id = a.contratante_id
ORDER BY a.executado_em DESC;

COMMENT ON VIEW vw_auditoria_senhas IS 'View simplificada para análise de auditoria de senhas';

-- ==========================================
-- 7. CONCEDER PERMISSÕES
-- ==========================================

-- Apenas postgres pode deletar diretamente da tabela de auditoria
REVOKE ALL ON entidades_senhas_audit FROM PUBLIC;
GRANT SELECT ON entidades_senhas_audit TO PUBLIC;

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
    RAISE NOTICE '  SELECT fn_delete_senha_autorizado(contratante_id, ''motivo'');';
    RAISE NOTICE '';
    RAISE NOTICE 'Ver auditoria:';
    RAISE NOTICE '  SELECT * FROM vw_auditoria_senhas LIMIT 10;';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

COMMIT;
