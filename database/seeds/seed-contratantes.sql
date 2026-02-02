-- Seed Data: Dados de teste para Contratantes (Clínicas e Entidades)
-- Data: 2025-12-18

\echo 'Inserindo dados de teste para contratantes...'

-- ============================================================================
-- CLÍNICAS (tipo = 'clinica')
-- ============================================================================

INSERT INTO
    contratantes (
        tipo,
        nome,
        cnpj,
        inscricao_estadual,
        email,
        telefone,
        endereco,
        cidade,
        estado,
        cep,
        responsavel_nome,
        responsavel_cpf,
        responsavel_cargo,
        responsavel_email,
        responsavel_celular,
        cartao_cnpj_path,
        contrato_social_path,
        doc_identificacao_path,
        status,
        ativa,
        aprovado_em,
        aprovado_por_cpf
    )
VALUES
    -- Clínica 1: Aprovada
    (
        'clinica',
        'Clínica de Medicina Ocupacional São Paulo',
        '12345678000100',
        '123456789',
        'contato@clinicasp.com.br',
        '(11) 3456-7890',
        'Av. Paulista, 1000 - Bela Vista',
        'São Paulo',
        'SP',
        '01310-100',
        'Dr. Carlos Silva',
        '12345678901',
        'Diretor Médico',
        'carlos.silva@clinicasp.com.br',
        '(11) 98765-4321',
        '/uploads/clinica1_cnpj.pdf',
        '/uploads/clinica1_contrato.pdf',
        '/uploads/clinica1_doc.pdf',
        'aprovado',
        true,
        CURRENT_TIMESTAMP,
        '11111111111'
    ),
    -- Clínica 2: Aprovada
    (
        'clinica',
        'MedWork Saúde Ocupacional',
        '23456789000111',
        '234567890',
        'admin@medwork.com.br',
        '(21) 2345-6789',
        'Rua do Comércio, 500 - Centro',
        'Rio de Janeiro',
        'RJ',
        '20010-000',
        'Dra. Maria Santos',
        '23456789012',
        'Gestora RH',
        'maria.santos@medwork.com.br',
        '(21) 97654-3210',
        '/uploads/clinica2_cnpj.pdf',
        '/uploads/clinica2_contrato.pdf',
        '/uploads/clinica2_doc.pdf',
        'aprovado',
        true,
        CURRENT_TIMESTAMP,
        '11111111111'
    ),
    -- Clínica 3: Pendente
    (
        'clinica',
        'Clínica Trabalho Seguro',
        '34567890000122',
        NULL,
        'contato@trabalhoseguro.com.br',
        '(31) 3234-5678',
        'Av. Afonso Pena, 1500 - Centro',
        'Belo Horizonte',
        'MG',
        '30130-000',
        'Dr. Pedro Oliveira',
        '34567890123',
        'Coordenador',
        'pedro@trabalhoseguro.com.br',
        '(31) 96543-2109',
        '/uploads/clinica3_cnpj.pdf',
        '/uploads/clinica3_contrato.pdf',
        '/uploads/clinica3_doc.pdf',
        'pendente',
        false,
        NULL,
        NULL
    );

-- ============================================================================
-- ENTIDADES (tipo = 'entidade')
-- ============================================================================

INSERT INTO
    contratantes (
        tipo,
        nome,
        cnpj,
        inscricao_estadual,
        email,
        telefone,
        endereco,
        cidade,
        estado,
        cep,
        responsavel_nome,
        responsavel_cpf,
        responsavel_cargo,
        responsavel_email,
        responsavel_celular,
        cartao_cnpj_path,
        contrato_social_path,
        doc_identificacao_path,
        status,
        ativa,
        aprovado_em,
        aprovado_por_cpf
    )
VALUES
    -- Entidade 1: Aprovada
    (
        'entidade',
        'Indústria Metalúrgica ABC Ltda',
        '45678901000133',
        '345678901',
        'rh@industriaabc.com.br',
        '(11) 4567-8901',
        'Rua das Indústrias, 2000 - Distrito Industrial',
        'São Bernardo do Campo',
        'SP',
        '09750-000',
        'João da Silva',
        '45678901234',
        'Gerente de RH',
        'joao.silva@industriaabc.com.br',
        '(11) 95432-1098',
        '/uploads/entidade1_cnpj.pdf',
        '/uploads/entidade1_contrato.pdf',
        '/uploads/entidade1_doc.pdf',
        'aprovado',
        true,
        CURRENT_TIMESTAMP,
        '11111111111'
    ),
    -- Entidade 2: Aprovada
    (
        'entidade',
        'Construtora Forte S.A.',
        '56789012000144',
        '456789012',
        'administrativo@construtoraforte.com.br',
        '(21) 3456-7890',
        'Av. Brasil, 5000 - Jardim América',
        'Rio de Janeiro',
        'RJ',
        '21040-000',
        'Ana Paula Costa',
        '56789012345',
        'Diretora Administrativa',
        'ana.costa@construtoraforte.com.br',
        '(21) 94321-0987',
        '/uploads/entidade2_cnpj.pdf',
        '/uploads/entidade2_contrato.pdf',
        '/uploads/entidade2_doc.pdf',
        'aprovado',
        true,
        CURRENT_TIMESTAMP,
        '11111111111'
    ),
    -- Entidade 3: Pendente
    (
        'entidade',
        'Empresa de Logística Rápida',
        '67890123000155',
        NULL,
        'cadastro@logisticarapida.com.br',
        '(19) 2345-6789',
        'Rod. Anhanguera, Km 100 - Distrito Industrial',
        'Campinas',
        'SP',
        '13054-000',
        'Roberto Alves',
        '67890123456',
        'Proprietário',
        'roberto@logisticarapida.com.br',
        '(19) 93210-9876',
        '/uploads/entidade3_cnpj.pdf',
        '/uploads/entidade3_contrato.pdf',
        '/uploads/entidade3_doc.pdf',
        'pendente',
        false,
        NULL,
        NULL
    ),
    -- Entidade 4: Em Reanálise
    (
        'entidade',
        'Tech Solutions Desenvolvimento',
        '78901234000166',
        NULL,
        'contato@techsolutions.com.br',
        '(11) 2345-6789',
        'Av. Faria Lima, 3000 - Itaim Bibi',
        'São Paulo',
        'SP',
        '04538-000',
        'Fernanda Lima',
        '78901234567',
        'CEO',
        'fernanda@techsolutions.com.br',
        '(11) 92109-8765',
        '/uploads/entidade4_cnpj.pdf',
        '/uploads/entidade4_contrato.pdf',
        '/uploads/entidade4_doc.pdf',
        'em_reanalise',
        false,
        NULL,
        NULL
    );

UPDATE contratantes
SET
    observacoes_reanalise = 'Por favor, enviar cópia legível do contrato social. O documento enviado está com qualidade ruim.'
WHERE
    cnpj = '78901234000166';

-- ============================================================================
-- RELACIONAMENTOS POLIMÓRFICOS (Exemplos)
-- ============================================================================

\echo 'Criando vínculos polimórficos de teste...'

-- Vincular funcionários existentes a contratantes (se houver funcionários no banco)
-- Nota: Ajustar IDs conforme dados reais

-- Exemplo: Funcionário ID 1 vinculado à Clínica 1
-- INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo)
-- VALUES (1, 1, 'clinica', true);

-- Exemplo: Funcionário ID 2 vinculado à Entidade 1
-- INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo)
-- VALUES (2, 4, 'entidade', true);

\echo 'Seed data inserido com sucesso!'
\echo ''
\echo 'Resumo:'
\echo '- 3 Clínicas (2 aprovadas, 1 pendente)'
\echo '- 4 Entidades (2 aprovadas, 1 pendente, 1 em reanálise)'
\echo ''
\echo 'Para visualizar:'
\echo 'SELECT tipo, nome, status FROM contratantes ORDER BY tipo, status;'