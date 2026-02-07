-- ============================================================================
-- MIGRACAO 499: Criar Tabela Separada para Clinicas
-- ============================================================================
-- Descricao: Cria tabela 'clinicas' separada da tabela 'entidades'
-- Data: 2026-02-06
-- Autor: Sistema de Migracao
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: Criar sequencia para IDs de clinicas
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'seq_clinicas_id') THEN
        CREATE SEQUENCE seq_clinicas_id START WITH 1 INCREMENT BY 1;
        RAISE NOTICE 'Sequencia seq_clinicas_id criada';
    ELSE
        RAISE NOTICE 'Sequencia seq_clinicas_id ja existe';
    END IF;
END $$;

-- ============================================================================
-- PARTE 2: Criar tabela clinicas
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinicas') THEN
        CREATE TABLE clinicas (
            id INTEGER PRIMARY KEY DEFAULT nextval('seq_clinicas_id'),
            
            -- Dados Cadastrais
            nome VARCHAR(200) NOT NULL,
            cnpj VARCHAR(18) NOT NULL UNIQUE,
            inscricao_estadual VARCHAR(50),
            email VARCHAR(100) NOT NULL UNIQUE,
            telefone VARCHAR(20) NOT NULL,
            
            -- Endereco
            endereco TEXT NOT NULL,
            cidade VARCHAR(100) NOT NULL,
            estado VARCHAR(2) NOT NULL,
            cep VARCHAR(10) NOT NULL,
            
            -- Responsavel/Gestor RH
            responsavel_nome VARCHAR(100) NOT NULL,
            responsavel_cpf VARCHAR(11) NOT NULL UNIQUE,
            responsavel_cargo VARCHAR(100),
            responsavel_email VARCHAR(100) NOT NULL,
            responsavel_celular VARCHAR(20) NOT NULL,
            
            -- Documentos
            cartao_cnpj_path VARCHAR(500),
            contrato_social_path VARCHAR(500),
            doc_identificacao_path VARCHAR(500),
            
            -- Status e Aprovação
            status status_aprovacao_enum DEFAULT 'pendente',
            motivo_rejeicao TEXT,
            observacoes_reanalise TEXT,
            ativa BOOLEAN DEFAULT true,
            
            -- Timestamps
            criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            aprovado_em TIMESTAMP WITHOUT TIME ZONE,
            aprovado_por_cpf VARCHAR(11),
            
            -- Pagamento e Plano
            pagamento_confirmado BOOLEAN DEFAULT false,
            numero_funcionarios_estimado INTEGER,
            plano_id INTEGER,
            data_primeiro_pagamento TIMESTAMP WITHOUT TIME ZONE,
            data_liberacao_login TIMESTAMP WITHOUT TIME ZONE,
            contrato_aceito BOOLEAN DEFAULT false,
            
            -- Constraints
            CONSTRAINT clinicas_estado_check CHECK (length(estado) = 2),
            CONSTRAINT clinicas_responsavel_cpf_check CHECK (length(responsavel_cpf) = 11),
            CONSTRAINT clinicas_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES planos(id)
        );
        
        RAISE NOTICE 'Tabela clinicas criada';
    ELSE
        RAISE NOTICE 'Tabela clinicas ja existe';
    END IF;
END $$;

-- ============================================================================
-- PARTE 3: Criar indices para performance
-- ============================================================================
DO $$
BEGIN
    -- Indices unicos
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'clinicas' AND indexname = 'clinicas_cnpj_unique') THEN
        CREATE UNIQUE INDEX clinicas_cnpj_unique ON clinicas(cnpj);
        RAISE NOTICE 'Indice clinicas_cnpj_unique criado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'clinicas' AND indexname = 'clinicas_email_unique') THEN
        CREATE UNIQUE INDEX clinicas_email_unique ON clinicas(email);
        RAISE NOTICE 'Indice clinicas_email_unique criado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'clinicas' AND indexname = 'clinicas_responsavel_cpf_unique') THEN
        CREATE UNIQUE INDEX clinicas_responsavel_cpf_unique ON clinicas(responsavel_cpf);
        RAISE NOTICE 'Indice clinicas_responsavel_cpf_unique criado';
    END IF;

    -- Indices de busca
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'clinicas' AND indexname = 'idx_clinicas_cnpj') THEN
        CREATE INDEX idx_clinicas_cnpj ON clinicas(cnpj);
        RAISE NOTICE 'Indice idx_clinicas_cnpj criado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'clinicas' AND indexname = 'idx_clinicas_status') THEN
        CREATE INDEX idx_clinicas_status ON clinicas(status);
        RAISE NOTICE 'Indice idx_clinicas_status criado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'clinicas' AND indexname = 'idx_clinicas_ativa') THEN
        CREATE INDEX idx_clinicas_ativa ON clinicas(ativa);
        RAISE NOTICE 'Indice idx_clinicas_ativa criado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'clinicas' AND indexname = 'idx_clinicas_status_data_cadastro') THEN
        CREATE INDEX idx_clinicas_status_data_cadastro ON clinicas(status, criado_em DESC);
        RAISE NOTICE 'Indice idx_clinicas_status_data_cadastro criado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'clinicas' AND indexname = 'idx_clinicas_aprovado_em') THEN
        CREATE INDEX idx_clinicas_aprovado_em ON clinicas(aprovado_em) WHERE aprovado_em IS NOT NULL;
        RAISE NOTICE 'Indice idx_clinicas_aprovado_em criado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'clinicas' AND indexname = 'idx_clinicas_contrato_aceito') THEN
        CREATE INDEX idx_clinicas_contrato_aceito ON clinicas(contrato_aceito);
        RAISE NOTICE 'Indice idx_clinicas_contrato_aceito criado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'clinicas' AND indexname = 'idx_clinicas_data_liberacao') THEN
        CREATE INDEX idx_clinicas_data_liberacao ON clinicas(data_liberacao_login);
        RAISE NOTICE 'Indice idx_clinicas_data_liberacao criado';
    END IF;
END $$;

-- ============================================================================
-- PARTE 4: Criar triggers
-- ============================================================================
DO $$
BEGIN
    -- Trigger de atualizacao de timestamp
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_clinicas_updated_at') THEN
        CREATE TRIGGER trg_clinicas_updated_at
            BEFORE UPDATE ON clinicas
            FOR EACH ROW
            WHEN (OLD.* IS DISTINCT FROM NEW.*)
            EXECUTE FUNCTION update_contratantes_updated_at();
        RAISE NOTICE 'Trigger trg_clinicas_updated_at criado';
    END IF;

    -- Trigger de sincronizacao status/ativa
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_clinicas_sync_status_ativa_robust') THEN
        CREATE TRIGGER tr_clinicas_sync_status_ativa_robust
            BEFORE INSERT OR UPDATE ON clinicas
            FOR EACH ROW
            EXECUTE FUNCTION contratantes_sync_status_ativa_robust();
        RAISE NOTICE 'Trigger tr_clinicas_sync_status_ativa_robust criado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_clinicas_sync_status_ativa_personalizado') THEN
        CREATE TRIGGER tr_clinicas_sync_status_ativa_personalizado
            BEFORE INSERT OR UPDATE ON clinicas
            FOR EACH ROW
            EXECUTE FUNCTION contratantes_sync_status_ativa_personalizado();
        RAISE NOTICE 'Trigger tr_clinicas_sync_status_ativa_personalizado criado';
    END IF;

    -- Trigger de criacao de usuario apos aprovacao
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_clinicas_criar_usuario_apos_aprovacao') THEN
        CREATE TRIGGER trg_clinicas_criar_usuario_apos_aprovacao
            AFTER UPDATE ON clinicas
            FOR EACH ROW
            EXECUTE FUNCTION criar_usuario_responsavel_apos_aprovacao();
        RAISE NOTICE 'Trigger trg_clinicas_criar_usuario_apos_aprovacao criado';
    END IF;

    -- Trigger de validacao de transicao de status
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_clinicas_validar_transicao_status') THEN
        CREATE TRIGGER trg_clinicas_validar_transicao_status
            BEFORE UPDATE OF status ON clinicas
            FOR EACH ROW
            EXECUTE FUNCTION validar_transicao_status_contratante();
        RAISE NOTICE 'Trigger trg_clinicas_validar_transicao_status criado';
    END IF;
END $$;

-- ============================================================================
-- PARTE 5: Criar políticas RLS (Row Level Security)
-- ============================================================================
DO $$
BEGIN
    -- Habilitar RLS na tabela
    ALTER TABLE clinicas ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitado na tabela clinicas';
    
    -- Politica para administradores (acesso total)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clinicas' AND policyname = 'clinicas_admin_all') THEN
        CREATE POLICY clinicas_admin_all ON clinicas
            USING (current_user_perfil() = 'admin')
            WITH CHECK (current_user_perfil() = 'admin');
        RAISE NOTICE 'Politica clinicas_admin_all criada';
    END IF;
END $$;

-- ============================================================================
-- PARTE 6: Remover campo 'tipo' da tabela entidades (opcional)
-- ============================================================================
-- Como agora temos tabelas separadas, o campo 'tipo' nao e mais necessario
-- Descomentar se desejar remove-lo:
/*
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'entidades' AND column_name = 'tipo') THEN
        -- Remover constraint de verificação primeiro
        ALTER TABLE entidades DROP CONSTRAINT IF EXISTS chk_contratantes_tipo_valido CASCADE;
        
        -- Remover índices relacionados
        DROP INDEX IF EXISTS idx_contratantes_tipo CASCADE;
        DROP INDEX IF EXISTS idx_contratantes_tipo_ativa CASCADE;
        DROP INDEX IF EXISTS idx_contratantes_tipo_status_ativa CASCADE;
        
        -- Remover coluna
        ALTER TABLE entidades DROP COLUMN tipo CASCADE;
        
        RAISE NOTICE '✓ Campo tipo removido da tabela entidades';
    END IF;
END $$;
*/

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'MIGRACAO 499 CONCLUIDA COM SUCESSO!';
    RAISE NOTICE 'Tabela clinicas criada com:';
    RAISE NOTICE '- Estrutura completa similar a entidades';
    RAISE NOTICE '- Indices para performance';
    RAISE NOTICE '- Triggers de validacao e auditoria';
    RAISE NOTICE '- Politicas RLS configuradas';
    RAISE NOTICE '====================================================================';
END $$;
