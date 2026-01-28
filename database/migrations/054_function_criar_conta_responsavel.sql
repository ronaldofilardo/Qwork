-- Migração 054: Função para criar conta responsável após ativação
-- Data: 19/01/2026
-- Descrição: Padroniza criação de conta responsável para personalizado, igual ao fixo

BEGIN;

-- Criar ou substituir função para criar conta responsável
CREATE OR REPLACE FUNCTION criar_conta_responsavel_personalizado(p_contratante_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_contratante RECORD;
    v_senha_temporaria VARCHAR(50);
    v_senha_hash VARCHAR(255);
    v_existe_conta BOOLEAN;
BEGIN
    -- Buscar dados do contratante
    SELECT * INTO v_contratante 
    FROM contratantes 
    WHERE id = p_contratante_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contratante ID % não encontrado', p_contratante_id;
    END IF;
    
    -- Verificar se conta já existe
    SELECT EXISTS(
        SELECT 1 FROM contratantes_senhas 
        WHERE contratante_id = p_contratante_id 
        AND cpf = v_contratante.responsavel_cpf
    ) INTO v_existe_conta;
    
    IF v_existe_conta THEN
        RAISE NOTICE 'Conta já existe para contratante %', p_contratante_id;
        RETURN;
    END IF;
    
    -- Gerar senha temporária (padrão: TEMP_ + CPF)
    v_senha_temporaria := 'TEMP_' || v_contratante.responsavel_cpf;
    
    -- Criar hash bcrypt da senha
    v_senha_hash := crypt(v_senha_temporaria, gen_salt('bf'));
    
    -- Inserir senha na tabela contratantes_senhas
    INSERT INTO contratantes_senhas (
        contratante_id, 
        cpf, 
        senha_hash, 
        criado_em,
        atualizado_em
    ) VALUES (
        p_contratante_id, 
        v_contratante.responsavel_cpf, 
        v_senha_hash, 
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
    -- Log de auditoria (se tabela audit_log existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        INSERT INTO audit_log (
            resource, 
            action, 
            resource_id, 
            details, 
            ip_address, 
            created_at
        ) VALUES (
            'contratantes_senhas', 
            'CREATE', 
            p_contratante_id, 
            'Conta responsável criada automaticamente via fluxo personalizado', 
            'system', 
            CURRENT_TIMESTAMP
        );
    END IF;
    
    RAISE NOTICE 'Conta criada para responsável CPF % do contratante %', v_contratante.responsavel_cpf, p_contratante_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro ao criar conta para contratante %: %', p_contratante_id, SQLERRM;
        -- Não falhar a transação principal, apenas logar o erro
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION criar_conta_responsavel_personalizado(INTEGER) IS 'Cria conta de acesso para responsável do contratante após ativação (fluxo personalizado)';

COMMIT;

SELECT '✓ Migração 054 aplicada com sucesso' AS status;
