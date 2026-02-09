-- ============================================================================
-- Migration: Corrigir função trigger para usar NEW.id ao invés de buscar por CNPJ
-- Data: 2026-02-08
-- Problema: O trigger estava buscando clinica_id por CNPJ, podendo retornar ID
--           incorreto. Deve usar diretamente NEW.id quando está em clinicas.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.criar_usuario_responsavel_apos_aprovacao()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    v_cpf VARCHAR(11);
    v_nome VARCHAR(200);
    v_senha_padrao VARCHAR(6);
    v_senha_hash TEXT;
    v_tipo_usuario VARCHAR(50);
    v_clinica_id INTEGER;
    v_entidade_id INTEGER;
    v_usuario_existe BOOLEAN;
    v_senha_existe BOOLEAN;
    v_tabela_origem TEXT;
BEGIN
    -- Apenas processar quando status muda para 'aprovado'
    IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN

        v_cpf := NEW.responsavel_cpf;
        v_nome := NEW.responsavel_nome;

        -- Gerar senha padrao (6 ultimos digitos do CNPJ)
        v_senha_padrao := RIGHT(REPLACE(NEW.cnpj, '-', ''), 6);
        v_senha_hash := crypt(v_senha_padrao, gen_salt('bf'));

        -- Determinar tabela de origem através do TG_TABLE_NAME
        v_tabela_origem := TG_TABLE_NAME;

        -- Determinar tipo de usuario e IDs baseado na tabela de origem
        IF v_tabela_origem = 'clinicas' THEN
            v_tipo_usuario := 'rh';
            
            -- ✅ CORREÇÃO: Usar NEW.id diretamente ao invés de buscar por CNPJ
            -- Quando o trigger é executado na tabela clinicas, NEW.id já é o clinica_id correto
            v_clinica_id := NEW.id;
            v_entidade_id := NULL;
            
            RAISE NOTICE '[TRIGGER] Criando usuário RH para clinica_id=% (CPF=%)', v_clinica_id, v_cpf;

        ELSIF v_tabela_origem = 'entidades' THEN
            v_tipo_usuario := 'gestor';
            v_clinica_id := NULL;
            
            -- Para entidades, NEW.id já é o entidade_id correto
            v_entidade_id := NEW.id;
            
            RAISE NOTICE '[TRIGGER] Criando usuário Gestor para entidade_id=% (CPF=%)', v_entidade_id, v_cpf;
            
        ELSE
            -- Fallback para compatibilidade com NEW.tipo (caso tabela tenha campo tipo)
            IF NEW.tipo = 'clinica' THEN
                v_tipo_usuario := 'rh';
                v_clinica_id := NEW.id;  -- Usar NEW.id diretamente
                v_entidade_id := NULL;
            ELSE
                v_tipo_usuario := 'gestor';
                v_clinica_id := NULL;
                v_entidade_id := NEW.id;
            END IF;
        END IF;

        -- Verificar se usuario ja existe
        SELECT EXISTS(SELECT 1 FROM usuarios WHERE cpf = v_cpf) INTO v_usuario_existe;

        -- Criar usuario se nao existir
        IF NOT v_usuario_existe THEN
            INSERT INTO usuarios (cpf, nome, tipo_usuario, clinica_id, entidade_id, ativo, criado_em, atualizado_em)
            VALUES (v_cpf, v_nome, v_tipo_usuario, v_clinica_id, v_entidade_id, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

            RAISE NOTICE '[TRIGGER] Usuario % criado com tipo_usuario=% clinica_id=% entidade_id=%', 
                         v_cpf, v_tipo_usuario, v_clinica_id, v_entidade_id;
        ELSE
            RAISE NOTICE '[TRIGGER] Usuario % já existe, pulando criação', v_cpf;
        END IF;

        -- Criar senha na tabela apropriada
        IF v_tabela_origem = 'clinicas' OR (v_tabela_origem != 'entidades' AND NEW.tipo = 'clinica') THEN
            SELECT EXISTS(SELECT 1 FROM clinicas_senhas WHERE cpf = v_cpf) INTO v_senha_existe;

            IF NOT v_senha_existe THEN
                INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada, criado_em)
                VALUES (v_clinica_id, v_cpf, v_senha_hash, false, CURRENT_TIMESTAMP);

                RAISE NOTICE '[TRIGGER] Senha criada em clinicas_senhas para RH % (clinica_id=%)', v_cpf, v_clinica_id;
            ELSE
                RAISE NOTICE '[TRIGGER] Senha já existe em clinicas_senhas para CPF %', v_cpf;
            END IF;
        ELSE
            SELECT EXISTS(SELECT 1 FROM entidades_senhas WHERE cpf = v_cpf AND entidade_id = v_entidade_id) INTO v_senha_existe;

            IF NOT v_senha_existe THEN
                INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash, primeira_senha_alterada, created_at, criado_em)
                VALUES (v_entidade_id, v_cpf, v_senha_hash, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

                RAISE NOTICE '[TRIGGER] Senha criada em entidades_senhas para gestor % (entidade_id=%)', v_cpf, v_entidade_id;
            ELSE
                RAISE NOTICE '[TRIGGER] Senha já existe em entidades_senhas para CPF % e entidade_id=%', v_cpf, v_entidade_id;
            END IF;
        END IF;

    END IF;

    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION criar_usuario_responsavel_apos_aprovacao() IS 
'Trigger function que cria automaticamente usuario RH ou Gestor quando entidade/clinica é aprovada.
CORREÇÃO (2026-02-08): Usa NEW.id diretamente ao invés de buscar por CNPJ, evitando atribuição de ID incorreto.';
