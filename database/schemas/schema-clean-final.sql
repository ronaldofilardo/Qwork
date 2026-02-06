-- Qwork - Schema LIMPO v2 - Admin & Clínicas
-- Compatível com Neon PostgreSQL e PostgreSQL Local
-- Etapa 1: Criação do Admin - VERSÃO FINAL

-- Tabela de Clínicas (Multi-tenant)
CREATE TABLE IF NOT EXISTS clinicas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnpj CHAR(14) UNIQUE,
    email VARCHAR(100),
    telefone VARCHAR(20),
    endereco TEXT,
    ativa BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Empresas Clientes
CREATE TABLE IF NOT EXISTS empresas_clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnpj CHAR(14) UNIQUE,
    email VARCHAR(100),
    telefone VARCHAR(20),
    endereco TEXT,
    clinica_id INTEGER REFERENCES clinicas (id) ON DELETE CASCADE,
    ativa BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
    id SERIAL PRIMARY KEY,
    cpf CHAR(11) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    setor VARCHAR(50),
    funcao VARCHAR(50),
    email VARCHAR(100),
    senha_hash TEXT NOT NULL,
    perfil VARCHAR(20) DEFAULT 'funcionario' CHECK (
        perfil IN (
            'funcionario',
            'rh',
            'admin',
            'emissor'
        )
    ),
    clinica_id INTEGER,
    empresa_id INTEGER,
    matricula VARCHAR(20),
    nivel_cargo VARCHAR(20),
    turno VARCHAR(50),
    escala VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Avaliações
CREATE TABLE IF NOT EXISTS avaliacoes (
    id SERIAL PRIMARY KEY,
    funcionario_cpf CHAR(11) NOT NULL REFERENCES funcionarios (cpf) ON DELETE CASCADE,
    inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    envio TIMESTAMP,
    status VARCHAR(20) DEFAULT 'iniciada' CHECK (
        status IN (
            'iniciada',
            'em_andamento',
            'concluido'
        )
    ),
    grupo_atual INT DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Respostas
CREATE TABLE IF NOT EXISTS respostas (
    id SERIAL PRIMARY KEY,
    avaliacao_id INT NOT NULL REFERENCES avaliacoes (id) ON DELETE CASCADE,
    grupo INT NOT NULL,
    item VARCHAR(10) NOT NULL,
    valor INT NOT NULL CHECK (valor IN (0, 25, 50, 75, 100)),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT respostas_avaliacao_id_grupo_item_key UNIQUE (avaliacao_id, grupo, item)
);

-- Tabela de Resultados (scores calculados)
CREATE TABLE IF NOT EXISTS resultados (
    id SERIAL PRIMARY KEY,
    avaliacao_id INT NOT NULL REFERENCES avaliacoes (id) ON DELETE CASCADE,
    grupo INT NOT NULL,
    dominio VARCHAR(100) NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    categoria VARCHAR(20) CHECK (
        categoria IN ('baixo', 'medio', 'alto')
    ),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT resultados_avaliacao_id_grupo_key UNIQUE (avaliacao_id, grupo)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_avaliacoes_funcionario ON avaliacoes (funcionario_cpf);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_status ON avaliacoes (status);

CREATE INDEX IF NOT EXISTS idx_respostas_avaliacao ON respostas (avaliacao_id);

CREATE INDEX IF NOT EXISTS idx_resultados_avaliacao ON resultados (avaliacao_id);

-- ============================================================================
-- SEEDS COM SENHAS BCRYPT CORRETAS
-- ============================================================================

-- SEED: Inserir clínica padrão
INSERT INTO
    clinicas (nome, cnpj, email, telefone)
VALUES (
        'Qwork - Clínica Padrão',
        '12345678000195',
        'contato@qwork.com.br',
        '(11) 99999-9999'
    ) ON CONFLICT DO NOTHING;

-- SEED: Inserir empresa cliente padrão
INSERT INTO
    empresas_clientes (nome, cnpj, email, clinica_id)
VALUES (
        'Indústria Metalúrgica São Paulo',
        '11222333000144',
        'contato@metalurgicasp.com.br',
        1
    ) ON CONFLICT DO NOTHING;

-- SEED: Admin (CPF: 00000000000, senha: admin123)
-- Hash gerado: bcrypt.hashSync('admin123', 10)
INSERT INTO
    funcionarios (
        cpf,
        nome,
        email,
        senha_hash,
        perfil
    )
VALUES (
        '00000000000',
        'Administrador',
        'admin@bpsbrasil.com.br',
        '$2a$10$JNwrj1i54gtUXDVqpFPEWeGo/jY8pK2vmx0mVwnVLmgs8Qzhs.bNW',
        'admin'
    ) ON CONFLICT (cpf) DO
UPDATE
SET
    nome = 'Administrador',
    email = 'admin@bpsbrasil.com.br',
    senha_hash = '$2a$10$JNwrj1i54gtUXDVqpFPEWeGo/jY8pK2vmx0mVwnVLmgs8Qzhs.bNW',
    perfil = 'admin',
    clinica_id = 1;

-- SEED: Administrador Clínica (CPF: 11111111111, senha: admin123)
-- Hash gerado: bcrypt.hashSync('admin123', 10)
INSERT INTO
    funcionarios (
        cpf,
        nome,
        email,
        senha_hash,
        perfil
    )
VALUES (
        '11111111111',
        'Administrador Clínica',
        'admin@bps.com.br',
        '$2a$10$ZinrjN3Je95XYcXunJNqGOn8Oa3FPPT.IOZzm9umupnVf41i4sr6m',
        'admin'
    ) ON CONFLICT (cpf) DO
UPDATE
SET
    nome = 'Administrador Clínica',
    email = 'admin@bps.com.br',
    senha_hash = '$2a$10$ZinrjN3Je95XYcXunJNqGOn8Oa3FPPT.IOZzm9umupnVf41i4sr6m',
    perfil = 'admin';

-- SEED: RH Gestor (CPF: 22222222222, senha: rh123)
-- Hash gerado: bcrypt.hashSync('rh123', 10)
INSERT INTO
    funcionarios (
        cpf,
        nome,
        email,
        senha_hash,
        perfil
    )
VALUES (
        '22222222222',
        'RH Gestor',
        'rh@bps.com.br',
        '$2a$10$qFf73.uHvCCBGdBXS64LNeMsNXorsmRqfIyXFACTY733BlIRleOiy',
        'rh'
    ) ON CONFLICT (cpf) DO
UPDATE
SET
    nome = 'RH Gestor',
    email = 'rh@bps.com.br',
    senha_hash = '$2a$10$qFf73.uHvCCBGdBXS64LNeMsNXorsmRqfIyXFACTY733BlIRleOiy',
    perfil = 'rh';

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================
SELECT
    '=== USUÁRIOS CRIADOS ===' as titulo,
    cpf,
    nome,
    perfil,
    ativo,
    CASE
        WHEN cpf = '00000000000' THEN '123'
        WHEN cpf = '11111111111' THEN 'admin123'
        WHEN cpf = '22222222222' THEN 'rh123'
        ELSE 'N/A'
    END as senha_para_login
FROM funcionarios
WHERE
    cpf IN (
        '00000000000',
        '11111111111',
        '22222222222'
    )
ORDER BY
    CASE
        WHEN perfil = 'admin' THEN 1
        WHEN perfil = 'rh' THEN 2
        WHEN perfil = 'emissor' THEN 3
        ELSE 4
    END;

SELECT '=== CLÍNICAS CRIADAS ===' as titulo, id, nome, cnpj, ativa
FROM clinicas;

SELECT '✅ BANCO RESETADO E USUÁRIOS CRIADOS COM SUCESSO!' as resultado;
