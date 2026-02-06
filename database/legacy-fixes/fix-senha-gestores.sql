-- Correção da geração de senhas para gestores
-- Data: 22/12/2025
-- Problema: Senhas hardcoded como '123' em vez dos últimos 6 dígitos do CNPJ

-- Atualizar função criar_senha_inicial_entidade para usar últimos 6 dígitos do CNPJ
CREATE OR REPLACE FUNCTION criar_senha_inicial_entidade(p_contratante_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_contratante RECORD;
    v_senha_inicial VARCHAR(6);
    v_senha_hash VARCHAR(255);
    v_funcionario_exists BOOLEAN;
BEGIN
    -- Buscar dados do contratante
    SELECT
        responsavel_nome,
        responsavel_cpf,
        responsavel_email,
        responsavel_celular,
        nome as empresa_nome,
        cnpj
    INTO v_contratante
    FROM contratantes
    WHERE id = p_contratante_id AND tipo = 'entidade';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contratante não encontrado ou não é do tipo entidade (ID: %)', p_contratante_id;
    END IF;

    -- Gerar senha inicial: últimos 6 dígitos do CNPJ (sem formatação)
    v_senha_inicial := RIGHT(REPLACE(REPLACE(REPLACE(v_contratante.cnpj, '.', ''), '/', ''), '-', ''), 6);

    -- Gerar hash da senha usando bcrypt (simulando bcrypt no PostgreSQL)
    -- Nota: PostgreSQL crypt usa Blowfish, similar ao bcrypt
    v_senha_hash := crypt(v_senha_inicial, gen_salt('bf'));

    -- Verificar se funcionário já existe
    SELECT EXISTS(
        SELECT 1 FROM funcionarios WHERE cpf = v_contratante.responsavel_cpf
    ) INTO v_funcionario_exists;

    IF v_funcionario_exists THEN
        -- Atualizar funcionário existente
        UPDATE funcionarios
        SET
            nome = v_contratante.responsavel_nome,
            email = v_contratante.responsavel_email,
            celular = v_contratante.responsavel_celular,
            perfil = 'gestor',
            contratante_id = p_contratante_id,
            ativo = true,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE cpf = v_contratante.responsavel_cpf;
    ELSE
        -- Inserir novo funcionário com perfil gestor
        INSERT INTO funcionarios (
            cpf,
            nome,
            email,
            celular,
            perfil,
            contratante_id,
            ativo,
            empresa_cliente_id,
            setor,
            funcao,
            nivel_cargo
        ) VALUES (
            v_contratante.responsavel_cpf,
            v_contratante.responsavel_nome,
            v_contratante.responsavel_email,
            v_contratante.responsavel_celular,
            'gestor',
            p_contratante_id,
            true,
            NULL,
            'Gestão',
            'Gestor da Entidade',
            'Gerencial'
        );
    END IF;

    -- Inserir ou atualizar senha
    INSERT INTO entidades_senhas (
        contratante_id,
        cpf,
        senha_hash
    ) VALUES (
        p_contratante_id,
        v_contratante.responsavel_cpf,
        v_senha_hash
    )
    ON CONFLICT (contratante_id)
    DO UPDATE SET
        senha_hash = EXCLUDED.senha_hash,
        atualizado_em = CURRENT_TIMESTAMP;

    RAISE NOTICE 'Senha inicial "%" criada para gestor da entidade (CPF: %)', v_senha_inicial, v_contratante.responsavel_cpf;
END;
$$ LANGUAGE plpgsql;

-- Comentário atualizado
COMMENT ON FUNCTION criar_senha_inicial_entidade(INTEGER) IS
'Cria ou atualiza funcionário com perfil gestor e senha baseada nos últimos 6 dígitos do CNPJ para o responsável do contratante';

-- Atualizar senhas existentes para entidades já cadastradas
-- Isso irá recalcular as senhas baseadas nos CNPJs atuais
DO $$
DECLARE
    contratante_record RECORD;
    v_senha_inicial VARCHAR(6);
    v_senha_hash VARCHAR(255);
BEGIN
    FOR contratante_record IN
        SELECT id, responsavel_cpf, cnpj
        FROM contratantes
        WHERE tipo = 'entidade' AND status = 'aprovado'
    LOOP
        -- Gerar nova senha
        v_senha_inicial := RIGHT(REPLACE(REPLACE(REPLACE(contratante_record.cnpj, '.', ''), '/', ''), '-', ''), 6);
        v_senha_hash := crypt(v_senha_inicial, gen_salt('bf'));

        -- Atualizar senha na tabela entidades_senhas
        UPDATE entidades_senhas
        SET senha_hash = v_senha_hash, atualizado_em = CURRENT_TIMESTAMP
        WHERE cpf = contratante_record.responsavel_cpf;

        RAISE NOTICE 'Senha atualizada para entidade ID %, CPF %, nova senha: %', contratante_record.id, contratante_record.responsavel_cpf, v_senha_inicial;
    END LOOP;
END $$;