-- =====================================================
-- MIGRACAO DEFINITIVA: REMOVER CONTRATANTE_ID
-- Substituir por ENTIDADE_ID em todas as tabelas
-- Data: 06/02/2026
-- =====================================================

BEGIN;

-- =====================================================
-- PARTE 1: MIGRAR CLINICAS DA TABELA ENTIDADES PARA CLINICAS
-- =====================================================

-- 1.1. Migrar clinica ID 41 (CNPJ 36882932000152)
INSERT INTO clinicas (
    nome, cnpj, email, telefone, endereco, ativa, 
    razao_social, criado_em, atualizado_em
)
SELECT 
    nome,
    cnpj,
    email,
    telefone,
    endereco,
    CASE WHEN status = 'aprovado' THEN true ELSE false END,
    nome, -- usando nome como razao_social
    criado_em,
    atualizado_em
FROM entidades
WHERE id = 41 AND tipo = 'clinica'
ON CONFLICT (cnpj) DO NOTHING;

-- 1.2. Buscar ID da clinica recem-criada para vincular usuario
DO $$
DECLARE
    v_clinica_id INTEGER;
    v_cpf VARCHAR(11) := '15562593017';
    v_senha_hash TEXT;
BEGIN
    -- Buscar ID da clinica
    SELECT id INTO v_clinica_id FROM clinicas WHERE cnpj = '36882932000152';
    
    IF v_clinica_id IS NOT NULL THEN
        -- Gerar senha hash para '000152' (ultimos 6 digitos do CNPJ)
        v_senha_hash := crypt('000152', gen_salt('bf'));
        
        -- Criar usuario RH se nao existir
        INSERT INTO usuarios (cpf, nome, tipo_usuario, clinica_id, ativo, criado_em, atualizado_em)
        SELECT '15562593017', 'sdsdf poiopiop', 'rh', v_clinica_id, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE cpf = v_cpf);
        
        -- Criar senha na tabela clinicas_senhas
        INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada, criado_em)
        SELECT v_clinica_id, v_cpf, v_senha_hash, false, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM clinicas_senhas WHERE cpf = v_cpf);
        
        RAISE NOTICE 'Usuario RH criado para clinica ID % (CNPJ 36882932000152)', v_clinica_id;
    END IF;
END $$;

-- 1.3. Criar senha para gestor 68292466010 da entidade 42 (CNPJ 47784097000134)
-- (senha 000134)
DO $$
DECLARE
    v_senha_hash TEXT;
    v_cpf VARCHAR(11) := '68292466010';
BEGIN
    -- Gerar senha hash para '000134'
    v_senha_hash := crypt('000134', gen_salt('bf'));
    
    -- Atualizar senha se ja existe
    UPDATE entidades_senhas 
    SET senha_hash = v_senha_hash,
        updated_at = CURRENT_TIMESTAMP,
        atualizado_em = CURRENT_TIMESTAMP
    WHERE cpf = v_cpf AND entidade_id = 42;
    
    -- Se nao atualizou nenhuma linha, inserir
    IF NOT FOUND THEN
        INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash, primeira_senha_alterada, created_at, criado_em)
        VALUES (42, v_cpf, v_senha_hash, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;
    
    RAISE NOTICE 'Senha atualizada para gestor % da entidade 42', v_cpf;
END $$;

-- =====================================================
-- PARTE 2: ADICIONAR COLUNA ENTIDADE_ID EM FUNCIONARIOS
-- =====================================================

-- 2.1. Adicionar coluna entidade_id se nao existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funcionarios' 
        AND column_name = 'entidade_id'
    ) THEN
        ALTER TABLE funcionarios ADD COLUMN entidade_id INTEGER;
        RAISE NOTICE 'Coluna entidade_id adicionada em funcionarios';
    ELSE
        RAISE NOTICE 'Coluna entidade_id ja existe em funcionarios';
    END IF;
END $$;

-- 2.2. Desabilitar trigger de audit temporariamente
ALTER TABLE funcionarios DISABLE TRIGGER ALL;

-- 2.3. Migrar dados de contratante_id para entidade_id
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE funcionarios
    SET entidade_id = contratante_id
    WHERE contratante_id IS NOT NULL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Dados migrados: % funcionarios atualizados', v_count;
END $$;

-- 2.4. Reabilitar triggers
ALTER TABLE funcionarios ENABLE TRIGGER ALL;

-- =====================================================
-- PARTE 3: REMOVER CONSTRAINTS E INDICES COM CONTRATANTE_ID
-- =====================================================

-- 3.1. Dropar constraint funcionarios_owner_check (referencia contratante_id)
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_owner_check;

-- 3.2. Dropar constraint funcionarios_clinica_id_check
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_id_check;

-- 3.3. Dropar indice idx_funcionarios_perfil_entities
DROP INDEX IF EXISTS idx_funcionarios_perfil_entities;

-- =====================================================
-- PARTE 4: RECRIAR CONSTRAINTS COM ENTIDADE_ID
-- =====================================================

-- 4.1. Recriar constraint de validacao de owner
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_owner_check CHECK (
    perfil::text = 'funcionario_entidade'::text 
        AND entidade_id IS NOT NULL 
        AND clinica_id IS NULL 
        AND empresa_id IS NULL 
    OR perfil::text = 'funcionario_clinica'::text 
        AND empresa_id IS NOT NULL 
        AND clinica_id IS NOT NULL 
        AND entidade_id IS NULL
    OR (perfil::text <> ALL (ARRAY[
        'funcionario_entidade'::character varying,
        'funcionario_clinica'::character varying
    ]::text[]))
);

-- 4.2. Recriar constraint clinica_id_check
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_clinica_id_check CHECK (
    (perfil::text = ANY (ARRAY[
        'emissor'::character varying, 
        'admin'::character varying,
        'gestao'::character varying
    ]::text[])) 
    OR clinica_id IS NOT NULL 
    OR entidade_id IS NOT NULL
);

-- 4.3. Criar foreign key para entidade_id
ALTER TABLE funcionarios 
ADD CONSTRAINT funcionarios_entidade_id_fkey 
FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE SET NULL;

-- 4.4. Criar indices para entidade_id
CREATE INDEX IF NOT EXISTS idx_funcionarios_entidade_id ON funcionarios(entidade_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_perfil_entities ON funcionarios(perfil, clinica_id, entidade_id);

-- =====================================================
-- PARTE 5: DROPAR POLICIES COM CONTRATANTE_ID
-- =====================================================

-- Dropar policies antigas que usam contratante_id
DROP POLICY IF EXISTS funcionarios_admin_rh_emissor_insert ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestorentidade_insert ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestorentidade_update ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestorentidade_select ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestorentidade_delete ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestorentidade_select_all ON funcionarios;

-- =====================================================
-- PARTE 6: RECRIAR POLICIES COM ENTIDADE_ID
-- =====================================================

-- Policy para admin inserir RH e emissor
CREATE POLICY funcionarios_admin_rh_emissor_insert ON funcionarios
    FOR INSERT
    WITH CHECK (
        (current_setting('app.current_user_perfil'::text, true) = 'admin'::text) 
        AND ((perfil)::text = ANY ((ARRAY[
            'rh'::character varying,
            'emissor'::character varying, 
            'admin'::character varying
        ])::text[])) 
        AND (
            ((perfil)::text = 'emissor'::text) 
            OR (((perfil)::text = 'rh'::text) 
                AND (clinica_id IS NOT NULL) 
                AND (entidade_id IS NULL)) 
            OR ((perfil)::text = 'admin'::text)
        )
    );

-- Policy para gestor_entidade inserir funcionarios
CREATE POLICY funcionarios_gestorentidade_insert ON funcionarios
    FOR INSERT
    WITH CHECK (
        (current_setting('app.current_user_perfil'::text, true) = 'gestor_entidade'::text) 
        AND (entidade_id IS NOT NULL) 
        AND (entidade_id = (NULLIF(current_setting('app.current_user_entidade_id'::text, true), ''::text))::integer) 
        AND (clinica_id IS NULL) 
        AND ((perfil)::text = 'funcionario'::text)
    );

-- Policy para gestor_entidade atualizar funcionarios
CREATE POLICY funcionarios_gestorentidade_update ON funcionarios
    FOR UPDATE
    USING (
        (current_setting('app.current_user_perfil'::text, true) = 'gestor_entidade'::text) 
        AND (entidade_id IS NOT NULL) 
        AND (entidade_id = (NULLIF(current_setting('app.current_user_entidade_id'::text, true), ''::text))::integer) 
        AND (clinica_id IS NULL)
    )
    WITH CHECK (
        (current_setting('app.current_user_perfil'::text, true) = 'gestor_entidade'::text) 
        AND (entidade_id = (NULLIF(current_setting('app.current_user_entidade_id'::text, true), ''::text))::integer) 
        AND (clinica_id IS NULL)
    );

-- Policy para gestor_entidade ver funcionarios
CREATE POLICY funcionarios_gestorentidade_select ON funcionarios
    FOR SELECT
    USING (
        (current_setting('app.current_user_perfil'::text, true) = 'gestor_entidade'::text) 
        AND (entidade_id IS NOT NULL) 
        AND (entidade_id = (NULLIF(current_setting('app.current_user_entidade_id'::text, true), ''::text))::integer) 
        AND (clinica_id IS NULL) 
        AND ((perfil)::text = 'funcionario'::text)
    );

-- Policy para gestor_entidade deletar funcionarios
CREATE POLICY funcionarios_gestorentidade_delete ON funcionarios
    FOR DELETE
    USING (
        (current_setting('app.current_user_perfil'::text, true) = 'gestor_entidade'::text) 
        AND (entidade_id IS NOT NULL) 
        AND (entidade_id = (NULLIF(current_setting('app.current_user_entidade_id'::text, true), ''::text))::integer) 
        AND (clinica_id IS NULL)
    );

-- Policy para gestor_entidade ver todos registros da sua entidade
CREATE POLICY funcionarios_gestorentidade_select_all ON funcionarios
    FOR SELECT
    USING (
        (current_setting('app.current_user_perfil'::text, true) = 'gestor_entidade'::text) 
        AND (entidade_id IS NOT NULL) 
        AND (entidade_id = (NULLIF(current_setting('app.current_user_entidade_id'::text, true), ''::text))::integer) 
        AND (clinica_id IS NULL)
    );

-- =====================================================
-- PARTE 7: ATUALIZAR CONFIGURACOES DE SESSAO
-- =====================================================

-- Atualizar funcoes que usam contratante_id para entidade_id
-- (assumindo que existam funcoes current_user_contratante_id)
DO $$
BEGIN
    -- Verificar se funcao existe antes de dropar
    -- Usar CASCADE para dropar dependencias (policies)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_contratante_id') THEN
        DROP FUNCTION IF EXISTS current_user_contratante_id() CASCADE;
        RAISE NOTICE 'Funcao current_user_contratante_id() removida com CASCADE';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_contratante_id_optional') THEN
        DROP FUNCTION IF EXISTS current_user_contratante_id_optional() CASCADE;
        RAISE NOTICE 'Funcao current_user_contratante_id_optional() removida com CASCADE';
    END IF;
END $$;

-- Criar funcao current_user_entidade_id se nao existir
CREATE OR REPLACE FUNCTION current_user_entidade_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_entidade_id', true), '')::INTEGER;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Criar funcao current_user_entidade_id_optional
CREATE OR REPLACE FUNCTION current_user_entidade_id_optional()
RETURNS INTEGER AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_entidade_id', true), '')::INTEGER;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- PARTE 8: REMOVER POLICIES ANTIGAS COM CONTRATANTE_ID
-- =====================================================

-- Dropar todas as policies antigas que usam contratante_id
DROP POLICY IF EXISTS funcionarios_gestor_entidade_select ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestor_entidade_insert ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestor_entidade_update ON funcionarios;
DROP POLICY IF EXISTS funcionarios_gestor_entidade_delete ON funcionarios;
DROP POLICY IF EXISTS funcionarios_rh_select ON funcionarios;
DROP POLICY IF EXISTS funcionarios_rh_insert ON funcionarios;
DROP POLICY IF EXISTS funcionarios_rh_update ON funcionarios;
DROP POLICY IF EXISTS funcionarios_rh_delete ON funcionarios;
DROP POLICY IF EXISTS funcionarios_admin_insert ON funcionarios;

-- =====================================================
-- PARTE 9: REMOVER COLUNA CONTRATANTE_ID DE FUNCIONARIOS
-- =====================================================

ALTER TABLE funcionarios DROP COLUMN IF EXISTS contratante_id;

DO $$
BEGIN
    RAISE NOTICE 'Coluna contratante_id removida de funcionarios';
END $$;

-- =====================================================
-- PARTE 10: REMOVER TABELA CONTRATANTES_SENHAS_AUDIT
-- =====================================================

DROP TABLE IF EXISTS contratantes_senhas_audit;

DO $$
BEGIN
    RAISE NOTICE 'Tabela contratantes_senhas_audit removida';
END $$;

-- =====================================================
-- PARTE 11: CORRIGIR TRIGGER DE CRIACAO DE USUARIOS
-- =====================================================

-- Atualizar funcao do trigger para nao usar contratante_id
CREATE OR REPLACE FUNCTION criar_usuario_responsavel_apos_aprovacao()
RETURNS TRIGGER AS $$
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
BEGIN
    -- Apenas processar quando status muda para 'aprovado'
    IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN
        
        v_cpf := NEW.responsavel_cpf;
        v_nome := NEW.responsavel_nome;
        
        -- Gerar senha padrao (6 ultimos digitos do CNPJ)
        v_senha_padrao := RIGHT(REPLACE(NEW.cnpj, '-', ''), 6);
        v_senha_hash := crypt(v_senha_padrao, gen_salt('bf'));
        
        -- Determinar tipo de usuario e IDs baseado no tipo
        IF NEW.tipo = 'clinica' THEN
            v_tipo_usuario := 'rh';
            
            -- Buscar clinica_id pelo CNPJ
            SELECT id INTO v_clinica_id FROM clinicas WHERE cnpj = NEW.cnpj;
            
            IF v_clinica_id IS NULL THEN
                RAISE NOTICE 'Clinica com CNPJ % nao encontrada na tabela clinicas. Pulando criacao de usuario.', NEW.cnpj;
                RETURN NEW;
            END IF;
            
            v_entidade_id := NULL;
        ELSE
            v_tipo_usuario := 'gestor';
            v_clinica_id := NULL;
            v_entidade_id := NEW.id;
        END IF;
        
        -- Verificar se usuario ja existe
        SELECT EXISTS(SELECT 1 FROM usuarios WHERE cpf = v_cpf) INTO v_usuario_existe;
        
        -- Criar usuario se nao existir
        IF NOT v_usuario_existe THEN
            INSERT INTO usuarios (cpf, nome, tipo_usuario, clinica_id, entidade_id, ativo, criado_em, atualizado_em)
            VALUES (v_cpf, v_nome, v_tipo_usuario, v_clinica_id, v_entidade_id, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            
            RAISE NOTICE 'Usuario % criado com tipo_usuario=%', v_cpf, v_tipo_usuario;
        END IF;
        
        -- Criar senha na tabela apropriada
        IF NEW.tipo = 'clinica' THEN
            SELECT EXISTS(SELECT 1 FROM clinicas_senhas WHERE cpf = v_cpf) INTO v_senha_existe;
            
            IF NOT v_senha_existe THEN
                INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada, criado_em)
                VALUES (v_clinica_id, v_cpf, v_senha_hash, false, CURRENT_TIMESTAMP);
                
                RAISE NOTICE 'Senha criada em clinicas_senhas para RH %', v_cpf;
            END IF;
        ELSE
            SELECT EXISTS(SELECT 1 FROM entidades_senhas WHERE cpf = v_cpf AND entidade_id = v_entidade_id) INTO v_senha_existe;
            
            IF NOT v_senha_existe THEN
                INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash, primeira_senha_alterada, created_at, criado_em)
                VALUES (v_entidade_id, v_cpf, v_senha_hash, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
                
                RAISE NOTICE 'Senha criada em entidades_senhas para gestor %', v_cpf;
            END IF;
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RESUMO DA MIGRACAO
-- =====================================================

DO $$
DECLARE
    v_count_funcionarios INTEGER;
    v_count_clinicas INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count_funcionarios FROM funcionarios WHERE entidade_id IS NOT NULL;
    SELECT COUNT(*) INTO v_count_clinicas FROM clinicas;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRACAO CONCLUIDA COM SUCESSO';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Funcionarios com entidade_id: %', v_count_funcionarios;
    RAISE NOTICE 'Total de clinicas: %', v_count_clinicas;
    RAISE NOTICE 'Coluna contratante_id removida';
    RAISE NOTICE 'Tabela contratantes_senhas_audit removida';
    RAISE NOTICE '========================================';
END $$;

COMMIT;
