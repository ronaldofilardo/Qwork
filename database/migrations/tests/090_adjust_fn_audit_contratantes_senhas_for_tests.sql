-- Migration 090: Atualiza fn_audit_entidades_senhas para permitir deletes em ambiente de teste
-- Data: 2026-01-24

BEGIN;

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
            CASE WHEN OLD.senha_hash != NEW.senha_hash THEN 'Senha alterada' ELSE 'Dados atualizados' END
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF current_setting('app.allow_senha_delete', true) IS NULL OR current_setting('app.allow_senha_delete', true) != 'true' THEN
            IF current_database() = 'nr-bps_db' THEN
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
                    'TENTATIVA BLOQUEADA: Delete nao autorizado'
                );
                RAISE EXCEPTION 'OPERAcaO BLOQUEADA: Delete de senhas requer autorizacao explicita. Use fn_delete_senha_autorizado() para deletar senhas com seguranca.';
            ELSE
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
                    'DELETE TESTE: Removido em ambiente de teste'
                );
                RETURN OLD;
            END IF;
        END IF;

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
            'Delete autorizado via funcao segura'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to use updated function
DROP TRIGGER IF EXISTS trg_protect_senhas ON entidades_senhas;
CREATE TRIGGER trg_protect_senhas
    BEFORE INSERT OR UPDATE OR DELETE ON entidades_senhas
    FOR EACH ROW
    EXECUTE FUNCTION fn_audit_entidades_senhas();

COMMIT;
