-- Migration 304: Corrigir funcao de auditoria de entidades_senhas
-- Problema: fn_audit_entidades_senhas() referencia contratante_id mas a coluna e entidade_id

-- Atualizar funcao de auditoria
CREATE OR REPLACE FUNCTION fn_audit_entidades_senhas()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
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
            NEW.entidade_id,  -- CORRIGIDO: era contratante_id
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
            NEW.entidade_id,  -- CORRIGIDO: era contratante_id
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
        -- PROTECAO CRITICA: Verificar se a delecao esta autorizada
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
                OLD.entidade_id,  -- CORRIGIDO: era contratante_id
                OLD.cpf,
                OLD.senha_hash,
                NULL,
                current_user,
                'TENTATIVA BLOQUEADA: Delete nao autorizado'
            );
            
            RAISE EXCEPTION 'OPERACAO BLOQUEADA: Delete de senhas requer autorizacao explicita. Use fn_delete_senha_autorizado() para deletar senhas com seguranca.';
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
            OLD.entidade_id,  -- CORRIGIDO: era contratante_id
            OLD.cpf,
            OLD.senha_hash,
            NULL,
            current_user,
            'Delete autorizado via funcao segura'
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Funcao fn_audit_entidades_senhas() corrigida: contratante_id para entidade_id';
END $$;
