-- ================================================================
-- CORRECAO: Medicina Ocupacional e Criacao Automatica de Usuarios
-- Data: 2026-02-06
-- ================================================================
-- OBJETIVO:
-- 1. Corrigir cadastro de "servico de medicina ocupacional" de entidade para clinica
-- 2. Criar automaticamente RH/Gestor na tabela usuarios quando aprovar
-- 3. Criar senha padrao (6 ultimos digitos do CNPJ)
-- ================================================================

BEGIN;

\echo '========================================='
\echo 'PARTE 1: Correcoes de Dados Existentes'
\echo '========================================='

-- 1.0 Criar tabela de auditoria se não existir (necessária para triggers)
CREATE TABLE IF NOT EXISTS contratantes_senhas_audit (
    id SERIAL PRIMARY KEY,
    operacao VARCHAR(10) NOT NULL,
    contratante_id INTEGER,
    cpf VARCHAR(11),
    senha_hash_anterior TEXT,
    senha_hash_nova TEXT,
    executado_por VARCHAR(100),
    motivo TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

\echo '1.0 Tabela de auditoria criada/verificada'

-- 1.1 Identificar e corrigir registros de medicina ocupacional cadastrados como entidade
DO $$
DECLARE
    v_entidade_id INT;
    v_cnpj VARCHAR(14);
    v_clinica_id INT;
    v_cpf VARCHAR(11);
    v_senha_hash TEXT;
    v_count INT := 0;
BEGIN
    -- Buscar entidades que parecem ser clínicas (medicina ocupacional, SMS, etc)
    FOR v_entidade_id, v_cnpj IN 
        SELECT id, cnpj 
        FROM entidades 
        WHERE tipo = 'entidade' 
        AND ( 
            LOWER(nome) LIKE '%medicina ocupacional%'
            OR LOWER(nome) LIKE '%servico%medicina%'
            OR LOWER(nome) LIKE '%sms%'
            OR LOWER(nome) LIKE '%clinica%'
        )
    LOOP
        v_count := v_count + 1;
        RAISE NOTICE 'Corrigindo entidade ID % (CNPJ: %) para clinica', v_entidade_id, v_cnpj;

        -- 1. Atualizar tipo de 'entidade' para 'clinica'
        UPDATE entidades 
        SET tipo = 'clinica', 
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = v_entidade_id;

        -- 2. Criar ou atualizar registro em clinicas
        INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, entidade_id, ativa, criado_em)
        SELECT nome, cnpj, email, telefone, endereco, id, ativa, criado_em
        FROM entidades
        WHERE id = v_entidade_id
        ON CONFLICT (cnpj) DO UPDATE 
            SET entidade_id = EXCLUDED.entidade_id,
                nome = EXCLUDED.nome,
                ativa = COALESCE(clinicas.ativa, EXCLUDED.ativa),
                atualizado_em = CURRENT_TIMESTAMP
        RETURNING id INTO v_clinica_id;

        RAISE NOTICE '  ✓ Clinica criada/atualizada com ID: %', v_clinica_id;

        -- 3. Migrar senha de entidades_senhas para clinicas_senhas
        FOR v_cpf, v_senha_hash IN
            SELECT cpf, senha_hash
            FROM entidades_senhas
            WHERE contratante_id = v_entidade_id
        LOOP
            INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada, criado_em)
            VALUES (v_clinica_id, v_cpf, v_senha_hash, false, CURRENT_TIMESTAMP)
            ON CONFLICT (cpf, clinica_id) DO NOTHING;

            DELETE FROM entidades_senhas WHERE contratante_id = v_entidade_id AND cpf = v_cpf;

            RAISE NOTICE '  ✓ Senha migrada para clinicas_senhas (CPF: %)', v_cpf;
        END LOOP;

    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE 'Total de entidades corrigidas: %', v_count;
END$$;

\echo ''
\echo '========================================='
\echo 'PARTE 2: Funcao para Criar Usuarios Automaticamente'
\echo '========================================='

-- ================================================================
-- 2.1 Funcao auxiliar para gerar senha padrao (6 ultimos digitos do CNPJ)
-- ================================================================
CREATE OR REPLACE FUNCTION gerar_senha_padrao_cnpj(p_cnpj VARCHAR)
RETURNS TEXT AS $$
DECLARE
    v_cnpj_limpo VARCHAR;
    v_senha_6_digitos VARCHAR;
BEGIN
    -- Remover caracteres nao numericos
    v_cnpj_limpo := regexp_replace(p_cnpj, '[^0-9]', '', 'g');
    
    -- Pegar ultimos 6 digitos
    v_senha_6_digitos := RIGHT(v_cnpj_limpo, 6);
    
    -- Se CNPJ tiver menos de 6 digitos, completar com zeros a esquerda
    IF LENGTH(v_senha_6_digitos) < 6 THEN
        v_senha_6_digitos := LPAD(v_senha_6_digitos, 6, '0');
    END IF;
    
    RETURN v_senha_6_digitos;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION gerar_senha_padrao_cnpj(VARCHAR) IS 
'Gera senha padrao usando os 6 ultimos digitos do CNPJ';

-- ================================================================
-- 2.2 Funcao para criar usuario RH/Gestor apos aprovacao
-- ================================================================
CREATE OR REPLACE FUNCTION criar_usuario_responsavel_apos_aprovacao()
RETURNS TRIGGER AS $$
DECLARE
    v_senha_plain TEXT;
    v_senha_hash TEXT;
    v_perfil TEXT;
    v_clinica_id INT;
    v_usuario_existe BOOLEAN;
BEGIN
    -- So executar quando status mudar para 'aprovado'
    IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN
        
        -- Determinar perfil baseado no tipo
        IF NEW.tipo = 'clinica' THEN
            v_perfil := 'rh';
        ELSIF NEW.tipo = 'entidade' THEN
            v_perfil := 'gestor';
        ELSE
            RAISE NOTICE 'Tipo nao reconhecido: %', NEW.tipo;
            RETURN NEW;
        END IF;

        -- Verificar se responsavel tem CPF
        IF NEW.responsavel_cpf IS NULL OR LENGTH(NEW.responsavel_cpf) < 11 THEN
            RAISE WARNING 'CPF do responsavel invalido para entidade %', NEW.id;
            RETURN NEW;
        END IF;

        -- Verificar se usuario ja existe
        SELECT EXISTS(SELECT 1 FROM usuarios WHERE cpf = NEW.responsavel_cpf) INTO v_usuario_existe;

        IF NOT v_usuario_existe THEN
            -- Gerar senha padrao
            v_senha_plain := gerar_senha_padrao_cnpj(NEW.cnpj);
            
            -- Hash da senha (usando crypt do pgcrypto)
            v_senha_hash := crypt(v_senha_plain, gen_salt('bf', 10));

            -- Inserir usuario na tabela usuarios
            -- Para RH: fornecer clinica_id
            -- Para Gestor: fornecer entidade_id
            IF v_perfil = 'rh' THEN
                -- Buscar ID da clinica correspondente pelo CNPJ
                SELECT id INTO v_clinica_id FROM clinicas WHERE cnpj = NEW.cnpj LIMIT 1;
                
                IF v_clinica_id IS NULL THEN
                    RAISE WARNING 'Clinica nao encontrada para CNPJ %, nao foi possivel criar usuario RH', NEW.cnpj;
                    RETURN NEW;
                END IF;

                INSERT INTO usuarios (cpf, nome, tipo_usuario, clinica_id, ativo, criado_em)
                VALUES (
                    NEW.responsavel_cpf,
                    COALESCE(NEW.responsavel_nome, NEW.nome),
                    v_perfil::usuario_tipo_enum,
                    v_clinica_id,
                    true,
                    CURRENT_TIMESTAMP
                );
            ELSIF v_perfil = 'gestor' THEN
                INSERT INTO usuarios (cpf, nome, tipo_usuario, entidade_id, ativo, criado_em)
                VALUES (
                    NEW.responsavel_cpf,
                    COALESCE(NEW.responsavel_nome, NEW.nome),
                    v_perfil::usuario_tipo_enum,
                    NEW.id,
                    true,
                    CURRENT_TIMESTAMP
                );
            END IF;

            RAISE NOTICE 'Usuario criado em usuarios: CPF %, tipo_usuario %', NEW.responsavel_cpf, v_perfil;
        ELSE
            RAISE NOTICE 'Usuario ja existe em usuarios: CPF %', NEW.responsavel_cpf;
        END IF;

        -- Se for CLINICA: criar senha em clinicas_senhas
        IF NEW.tipo = 'clinica' THEN
            -- Buscar ID da clinica correspondente pelo CNPJ
            SELECT id INTO v_clinica_id FROM clinicas WHERE cnpj = NEW.cnpj LIMIT 1;

            IF v_clinica_id IS NOT NULL THEN
                -- Gerar senha padrao se nao foi gerada ainda
                IF v_senha_hash IS NULL THEN
                    v_senha_plain := gerar_senha_padrao_cnpj(NEW.cnpj);
                    v_senha_hash := crypt(v_senha_plain, gen_salt('bf', 10));
                END IF;

                INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada, criado_em)
                VALUES (v_clinica_id, NEW.responsavel_cpf, v_senha_hash, false, CURRENT_TIMESTAMP)
                ON CONFLICT (cpf, clinica_id) DO NOTHING;

                RAISE NOTICE 'Senha criada em clinicas_senhas para RH: CPF %, Clinica ID %', NEW.responsavel_cpf, v_clinica_id;
            ELSE
                RAISE WARNING 'Clinica nao encontrada para entidade %', NEW.id;
            END IF;
        END IF;

        -- Se for ENTIDADE: criar senha em entidades_senhas
        IF NEW.tipo = 'entidade' THEN
            -- Gerar senha padrao se nao foi gerada ainda
            IF v_senha_hash IS NULL THEN
                v_senha_plain := gerar_senha_padrao_cnpj(NEW.cnpj);
                v_senha_hash := crypt(v_senha_plain, gen_salt('bf', 10));
            END IF;

            INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash, primeira_senha_alterada, criado_em)
            VALUES (NEW.id, NEW.responsavel_cpf, v_senha_hash, false, CURRENT_TIMESTAMP)
            ON CONFLICT (entidade_id, cpf) DO NOTHING;

            RAISE NOTICE 'Senha criada em entidades_senhas para Gestor: CPF %, Entidade ID %', NEW.responsavel_cpf, NEW.id;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION criar_usuario_responsavel_apos_aprovacao() IS 
'Trigger function que cria automaticamente usuario, RH ou Gestor quando entidade e aprovada';

-- ================================================================
-- 2.3 Criar trigger na tabela entidades
-- ================================================================
DROP TRIGGER IF EXISTS trg_criar_usuario_apos_aprovacao ON entidades;

CREATE TRIGGER trg_criar_usuario_apos_aprovacao
AFTER UPDATE ON entidades
FOR EACH ROW
EXECUTE FUNCTION criar_usuario_responsavel_apos_aprovacao();

COMMENT ON TRIGGER trg_criar_usuario_apos_aprovacao ON entidades IS 
'Cria automaticamente usuario e senhas quando entidade e aprovada';

\echo ''
\echo '========================================='
\echo 'PARTE 3: Criar Usuarios para Aprovados Existentes'
\echo '========================================='

-- Criar usuarios para entidades que ja foram aprovadas mas nao tem usuario
DO $$
DECLARE
    v_record RECORD;
    v_senha_plain TEXT;
    v_senha_hash TEXT;
    v_perfil TEXT;
    v_clinica_id INT;
    v_count INT := 0;
BEGIN
    FOR v_record IN 
        SELECT e.* 
        FROM entidades e
        WHERE e.status = 'aprovado'
        AND e.responsavel_cpf IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.cpf = e.responsavel_cpf)
    LOOP
        v_count := v_count + 1;
        
        -- Determinar perfil
        IF v_record.tipo = 'clinica' THEN
            v_perfil := 'rh';
        ELSIF v_record.tipo = 'entidade' THEN
            v_perfil := 'gestor';
        ELSE
            CONTINUE;
        END IF;

        -- Gerar senha
        v_senha_plain := gerar_senha_padrao_cnpj(v_record.cnpj);
        v_senha_hash := crypt(v_senha_plain, gen_salt('bf', 10));

        -- Criar usuario (com clinica_id ou entidade_id conforme o tipo)
        IF v_perfil = 'rh' THEN
            SELECT id INTO v_clinica_id FROM clinicas WHERE cnpj = v_record.cnpj LIMIT 1;
            
            IF v_clinica_id IS NULL THEN
                RAISE WARNING 'Clinica nao encontrada para CNPJ %, pulando criacao de usuario', v_record.cnpj;
                CONTINUE;
            END IF;

            INSERT INTO usuarios (cpf, nome, tipo_usuario, clinica_id, ativo, criado_em)
            VALUES (
                v_record.responsavel_cpf,
                COALESCE(v_record.responsavel_nome, v_record.nome),
                v_perfil::usuario_tipo_enum,
                v_clinica_id,
                true,
                CURRENT_TIMESTAMP
            );
        ELSIF v_perfil = 'gestor' THEN
            INSERT INTO usuarios (cpf, nome, tipo_usuario, entidade_id, ativo, criado_em)
            VALUES (
                v_record.responsavel_cpf,
                COALESCE(v_record.responsavel_nome, v_record.nome),
                v_perfil::usuario_tipo_enum,
                v_record.id,
                true,
                CURRENT_TIMESTAMP
            );
        END IF;

        RAISE NOTICE 'Usuario criado: % (%), perfil: %', 
            v_record.responsavel_nome, v_record.responsavel_cpf, v_perfil;

        -- Criar senha na tabela apropriada
        IF v_record.tipo = 'clinica' THEN
            SELECT id INTO v_clinica_id FROM clinicas WHERE cnpj = v_record.cnpj LIMIT 1;
            
            IF v_clinica_id IS NOT NULL THEN
                INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada, criado_em)
                VALUES (v_clinica_id, v_record.responsavel_cpf, v_senha_hash, false, CURRENT_TIMESTAMP)
                ON CONFLICT DO NOTHING;
            END IF;
        ELSIF v_record.tipo = 'entidade' THEN
            INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash, primeira_senha_alterada, criado_em)
            VALUES (v_record.id, v_record.responsavel_cpf, v_senha_hash, false, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;

    RAISE NOTICE '';
   RAISE NOTICE 'Total de usuarios criados: %', v_count;
END$$;

\echo ''
\echo '========================================='
\echo 'FINALIZACAO'
\echo '========================================='

COMMIT;

\echo ''
\echo 'Correcoes aplicadas com sucesso!'
\echo ''
\echo 'RESUMO:'
\echo '1. Corrigidos registros de medicina ocupacional de entidade para clinica'
\echo '2. Criada funcao para gerar senha padrao (6 ultimos digitos do CNPJ)'  
\echo '3. Criado trigger para criar usuarios automaticamente na aprovacao'
\echo '4. Criados usuarios para entidades ja aprovadas que nao tinham usuario'
\echo ''
