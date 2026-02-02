-- ETAPA 3: Cadastro de Empresas Clientes
-- Criar tabela empresas_clientes e seed empresa teste

-- 1. Criar tabela empresas_clientes
CREATE TABLE empresas_clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18) NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(50),
    estado VARCHAR(2),
    cep VARCHAR(10),
    ativa BOOLEAN DEFAULT true,
    clinica_id INTEGER NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

-- Chave estrangeira para clínica
FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,

-- Constraint única para CNPJ por clínica
UNIQUE(clinica_id, cnpj) );

-- 2. Criar índices para performance
CREATE INDEX idx_empresas_clinica ON empresas_clientes (clinica_id);

CREATE INDEX idx_empresas_ativa ON empresas_clientes (ativa);

CREATE INDEX idx_empresas_cnpj ON empresas_clientes (cnpj);

-- 3. Inserir empresas teste para cada clínica
-- Empresa teste para Clínica 1 (Qwork)
INSERT INTO
    empresas_clientes (
        nome,
        cnpj,
        email,
        telefone,
        endereco,
        cidade,
        estado,
        cep,
        clinica_id
    )
VALUES (
        'Indústria Metalúrgica São Paulo',
        '11222333000144',
        'contato@metalurgicasp.com.br',
        '(11) 3333-4444',
        'Rua Industrial, 500 - Distrito Industrial',
        'São Paulo',
        'SP',
        '01234-567',
        1
    );

-- Empresa teste para Clínica 2 (Medicina do Trabalho ABC)
INSERT INTO
    empresas_clientes (
        nome,
        cnpj,
        email,
        telefone,
        endereco,
        cidade,
        estado,
        cep,
        clinica_id
    )
VALUES (
        'Construtora ABC Ltda',
        '22333444000155',
        'rh@construtorabc.com.br',
        '(11) 5555-6666',
        'Av. Paulista, 1000 - Centro',
        'São Paulo',
        'SP',
        '01310-100',
        2
    );

-- 4. Verificar estrutura criada
SELECT '=== TABELA EMPRESAS_CLIENTES CRIADA ===' as titulo;

SELECT 
    ec.id,
    ec.nome as empresa,
    ec.cnpj,
    c.nome as clinica,
    ec.ativa,
    ec.criado_em::date as criado_em
FROM empresas_clientes ec
JOIN clinicas c ON ec.clinica_id = c.id
ORDER BY c.nome, ec.nome;

SELECT '✅ ETAPA 3.1 CONCLUÍDA - TABELA E SEEDS CRIADOS!' as resultado;