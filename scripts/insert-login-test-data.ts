import { query } from '../lib/db';

// Segurança: impedir execução acidental contra bancos não-testes
if (
  !process.env.TEST_DATABASE_URL ||
  !String(process.env.TEST_DATABASE_URL).includes('_test')
) {
  if (process.env.ALLOW_NON_TEST_DB === 'true') {
    console.warn(
      '⚠️ AVISO: TEST_DATABASE_URL não aponta para um banco de teste, mas OVERRIDE habilitado via ALLOW_NON_TEST_DB=true. Prosseguindo sob sua responsabilidade.'
    );
  } else {
    console.error(
      '🚨 ERRO: TEST_DATABASE_URL não está definido ou não aponta para o banco de testes (nr-bps_db_test). Para proteger seus dados, o script foi abortado. Execute com TEST_DATABASE_URL apontando para nr-bps_db_test ou defina ALLOW_NON_TEST_DB=true para forçar a execução.'
    );
    process.exit(1);
  }
}

async function insertLoginTestData() {
  try {
    console.log('🔄 Inserindo dados de teste para login...');

    // Garantir contexto para triggers de auditoria (app.current_user_cpf deve estar setado)
    await query(`SELECT set_config('app.current_user_cpf', '00000000000', false)`);
    await query(`SELECT set_config('app.current_user_perfil', 'system', false)`);
    await query(`SELECT set_config('app.client_ip', '127.0.0.1', false)`);


    // Inserir clínica
    await query(`
      INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, ativa)
      SELECT 'Clínica Teste BPS', '12345678000123', 'contato@teste.com', '11999999999', 'Rua Teste, 123', true
      WHERE NOT EXISTS (SELECT 1 FROM clinicas WHERE cnpj = '12345678000123')
    `);

    // Inserir empresas
    await query(`
      INSERT INTO empresas_clientes (nome, cnpj, email, telefone, endereco, cidade, estado, cep, ativa, clinica_id)
      SELECT 'Empresa Teste BPS', '98765432000198', 'empresa@teste.com', '11888888888', 'Av Empresa, 456', 'São Paulo', 'SP', '01234000', true, (SELECT id FROM clinicas WHERE cnpj = '12345678000123')
      WHERE NOT EXISTS (SELECT 1 FROM empresas_clientes WHERE cnpj = '98765432000198')
    `);

    await query(`
      INSERT INTO empresas_clientes (nome, cnpj, email, telefone, endereco, cidade, estado, cep, ativa, clinica_id)
      SELECT 'Empresa Alfa', '11122233000144', 'alfa@teste.com', '11666666666', 'Rua Alfa, 100', 'São Paulo', 'SP', '01234001', true, (SELECT id FROM clinicas WHERE cnpj = '12345678000123')
      WHERE NOT EXISTS (SELECT 1 FROM empresas_clientes WHERE cnpj = '11122233000144')
    `);

    // Senha hash para '123': $2a$10$bOCO5aMKPsWK2QWpbxC3Zu3Y7Y2DzXboFkyVDxvXlMfTDl8kVQat2
    // Inserir funcionários, RH e admin (apenas um RH ativo por clínica devido à constraint)

    // Garantir default para usuario_tipo (evita falhas em ambientes de teste mais estritos)
    // Padrão para funcionários de clínica
    await query(`ALTER TABLE funcionarios ALTER COLUMN usuario_tipo SET DEFAULT 'funcionario_clinica'`);

    await query(`
      INSERT INTO funcionarios (cpf, nome, setor, funcao, email, senha_hash, perfil, ativo, clinica_id, empresa_id, matricula, turno, escala, nivel_cargo)
      VALUES
        ('22222222222', 'João Silva', 'TI', 'Analista', 'joao@email.com', '$2a$10$bOCO5aMKPsWK2QWpbxC3Zu3Y7Y2DzXboFkyVDxvXlMfTDl8kVQat2', 'funcionario', true, (SELECT id FROM clinicas WHERE cnpj = '12345678000123'), (SELECT id FROM empresas_clientes WHERE cnpj = '98765432000198'), '001', 'manhã', '5x2', 'operacional'),
        ('99999999999', 'Maria Santos', 'RH', 'Gerente', 'maria@email.com', '$2a$10$bOCO5aMKPsWK2QWpbxC3Zu3Y7Y2DzXboFkyVDxvXlMfTDl8kVQat2', 'funcionario', true, (SELECT id FROM clinicas WHERE cnpj = '12345678000123'), (SELECT id FROM empresas_clientes WHERE cnpj = '98765432000198'), '002', 'tarde', '5x2', 'gestao'),
        ('11111111111', 'Pedro Oliveira', 'RH', 'Coordenador RH', 'pedro@email.com', '$2a$10$bOCO5aMKPsWK2QWpbxC3Zu3Y7Y2DzXboFkyVDxvXlMfTDl8kVQat2', 'rh', true, (SELECT id FROM clinicas WHERE cnpj = '12345678000123'), (SELECT id FROM empresas_clientes WHERE cnpj = '98765432000198'), '003', 'manhã', '5x2', NULL),
        ('44444444444', 'Carlos Mendes', 'Operações', 'Operador', 'carlos@email.com', '$2a$10$bOCO5aMKPsWK2QWpbxC3Zu3Y7Y2DzXboFkyVDxvXlMfTDl8kVQat2', 'funcionario', true, (SELECT id FROM clinicas WHERE cnpj = '12345678000123'), (SELECT id FROM empresas_clientes WHERE cnpj = '11122233000144'), '005', 'noite', '5x2', 'operacional'),
        ('00000000000', 'Admin', 'TI', 'Administrador', 'admin@bpsbrasil.com.br', '$2a$10$1FmG9Rn0QJ9T78GbvS/Yf.AfR9tp9qTxBznhUWLwBhsP8BChtmSVW', 'admin', true, (SELECT id FROM clinicas WHERE cnpj = '12345678000123'), NULL, '000', 'integral', '5x2', NULL)
      ON CONFLICT (cpf) DO UPDATE SET
        nome = EXCLUDED.nome,
        setor = EXCLUDED.setor,
        funcao = EXCLUDED.funcao,
        email = EXCLUDED.email,
        senha_hash = EXCLUDED.senha_hash,
        perfil = EXCLUDED.perfil,
        ativo = EXCLUDED.ativo,
        clinica_id = EXCLUDED.clinica_id,
        empresa_id = EXCLUDED.empresa_id,
        matricula = EXCLUDED.matricula,
        turno = EXCLUDED.turno,
        escala = EXCLUDED.escala,
        nivel_cargo = EXCLUDED.nivel_cargo
    `);

    // Inserir contratante e assoc. de senha para RH (necessário para validação de sessão 'rh')
    await query(`
      INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa)
      SELECT 'clinica', 'Contratante Teste', '55566677000188', 'contratante@teste.com', '11911112222', 'Rua Contratante, 1', 'São Paulo', 'SP', '01234002', 'Pedro Oliveira', '11111111111', 'pedro@email.com', '11999990000', false
      WHERE NOT EXISTS (SELECT 1 FROM contratantes WHERE cnpj = '55566677000188')
    `);

    // Atualiza se já existir, senão insere
    await query(`
      UPDATE contratantes_senhas SET senha_hash = '$2a$10$bOCO5aMKPsWK2QWpbxC3Zu3Y7Y2DzXboFkyVDxvXlMfTDl8kVQat2' WHERE cpf = '11111111111';
      INSERT INTO contratantes_senhas (contratante_id, cpf, senha_hash)
      SELECT (SELECT id FROM contratantes WHERE cnpj = '55566677000188'), '11111111111', '$2a$10$bOCO5aMKPsWK2QWpbxC3Zu3Y7Y2DzXboFkyVDxvXlMfTDl8kVQat2'
      WHERE NOT EXISTS (SELECT 1 FROM contratantes_senhas WHERE cpf = '11111111111');
    `);

    // Garantir que a clínica inserida aponte para o contratante (necessário para endpoints RH)
    await query(`
      UPDATE clinicas
      SET contratante_id = (SELECT id FROM contratantes WHERE cnpj = '55566677000188')
      WHERE cnpj = '12345678000123';
    `);

    console.log('✅ Dados de teste para login inseridos com sucesso!');

    // Criar contrato e pagamento para o contratante associado à clínica de teste (cnpj 55566677000188)
    await query(`
      INSERT INTO contratos (contratante_id, plano_id, aceito, hash_contrato, criado_em)
      SELECT c.id, (SELECT id FROM planos WHERE ativo = true ORDER BY preco ASC LIMIT 1), true, md5(random()::text), CURRENT_TIMESTAMP
      FROM contratantes c
      WHERE c.cnpj = '55566677000188'
      AND NOT EXISTS (SELECT 1 FROM contratos co WHERE co.contratante_id = c.id)
    `);

    await query(`
      INSERT INTO pagamentos (contratante_id, contrato_id, valor, status, metodo, numero_parcelas, criado_em, data_pagamento)
      SELECT c.id, (SELECT id FROM contratos WHERE contratante_id = c.id ORDER BY criado_em DESC LIMIT 1), 1000.00, 'pago', 'pix', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM contratantes c
      WHERE c.cnpj = '55566677000188'
      AND NOT EXISTS (SELECT 1 FROM pagamentos p WHERE p.contratante_id = c.id AND p.status = 'pago')
    `);

    // Garantir que exista pelo menos um pagamento PAGO para contratante_id = 2
    await query(`
      INSERT INTO pagamentos (contratante_id, contrato_id, valor, status, metodo, numero_parcelas, criado_em, data_pagamento)
      SELECT 2, NULL, 1000.00, 'pago', 'pix', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      WHERE NOT EXISTS (SELECT 1 FROM pagamentos WHERE contratante_id = 2 AND status = 'pago')
    `);

    console.log('📋 Usuários disponíveis:');
    console.log('  - Admin: CPF 00000000000 / senha 123');
    console.log('  - RH (Empresa Teste): CPF 11111111111 / senha 123');
    console.log(
      '  - Funcionários: CPF 22222222222, 99999999999, 44444444444 / senha 123'
    );
  } catch (error) {
    console.error('❌ Erro ao inserir dados de teste:', error.message);
    process.exit(1);
  }
}

insertLoginTestData();
