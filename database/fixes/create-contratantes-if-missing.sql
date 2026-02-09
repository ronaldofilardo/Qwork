DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tomadores') THEN
        CREATE TABLE tomadores (
            id SERIAL PRIMARY KEY,
            tipo tipo_contratante_enum NOT NULL,
            nome VARCHAR(200) NOT NULL,
            cnpj VARCHAR(18) NOT NULL,
            inscricao_estadual VARCHAR(50),
            email VARCHAR(100) NOT NULL,
            telefone VARCHAR(20) NOT NULL,
            endereco TEXT NOT NULL,
            cidade VARCHAR(100) NOT NULL,
            estado VARCHAR(2) NOT NULL,
            cep VARCHAR(10) NOT NULL,
            responsavel_nome VARCHAR(100) NOT NULL,
            responsavel_cpf VARCHAR(11) NOT NULL,
            responsavel_cargo VARCHAR(100),
            responsavel_email VARCHAR(100) NOT NULL,
            responsavel_celular VARCHAR(20) NOT NULL,
            cartao_cnpj_path VARCHAR(500),
            contrato_social_path VARCHAR(500),
            doc_identificacao_path VARCHAR(500),
            status status_aprovacao_enum DEFAULT 'pendente',
            motivo_rejeicao TEXT,
            observacoes_reanalise TEXT,
            ativa BOOLEAN DEFAULT true,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            aprovado_em TIMESTAMP,
            aprovado_por_cpf VARCHAR(11)
        );
        CREATE INDEX IF NOT EXISTS idx_tomadores_tipo ON tomadores (tipo);
        CREATE INDEX IF NOT EXISTS idx_tomadores_status ON tomadores (status);
        CREATE INDEX IF NOT EXISTS idx_tomadores_cnpj ON tomadores (cnpj);
        CREATE INDEX IF NOT EXISTS idx_tomadores_ativa ON tomadores (ativa);
        CREATE INDEX IF NOT EXISTS idx_tomadores_tipo_ativa ON tomadores (tipo, ativa);
        COMMENT ON TABLE tomadores IS 'Tabela unificada para clínicas e entidades privadas';
    ELSE
        RAISE NOTICE 'Tabela tomadores já existe';
    END IF;
END $$;