CREATE OR REPLACE FUNCTION public.fn_audit_entidades_senhas()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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
            NEW.entidade_id,
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
            NEW.entidade_id,
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
                OLD.entidade_id,
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
            OLD.entidade_id,
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
$$