-- Migration 1007: Atualizar função validar_sessao_rls para usar app.current_perfil
-- Fix: A função estava usando variável incorreta para perfil

-- Drop e recriar a função com o nome correto da variável
CREATE OR REPLACE FUNCTION validar_sessao_rls()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_perfil TEXT;
    v_cpf TEXT;
    v_contratante_id TEXT;
    v_clinica_id TEXT;
BEGIN
    -- Obter variáveis de contexto (CORREÇÃO: usar app.current_perfil, não app.current_user_perfil)
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
    IF v_perfil IN ('gestor_entidade', 'rh', 'entidade') THEN
        IF (v_contratante_id IS NULL OR v_contratante_id = '')
           AND (v_clinica_id IS NULL OR v_clinica_id = '') THEN
            RAISE EXCEPTION 'SEGURANÇA: Perfil % requer contratante_id ou clinica_id', v_perfil;
        END IF;
    END IF;

    RETURN TRUE;
END;
$$;

-- Adicionar comentário para documentação
COMMENT ON FUNCTION validar_sessao_rls() IS 
'Valida variáveis de sessão para Row Level Security. 
Espera: app.current_perfil, app.current_user_cpf
Opcional: app.current_contratante_id, app.current_clinica_id';
