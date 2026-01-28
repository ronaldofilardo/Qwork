/* eslint-disable @typescript-eslint/no-explicit-any */
jest.resetModules();

// Garantir variável de ambiente para carregar lib/db em modo teste
process.env.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:123456@localhost:5432/' + ('nr' + '-bps_db_test');

// Mock de bcryptjs antes do import para controlar hash/compare
jest.mock('bcryptjs', () => ({
  hash: jest.fn(async (_pw: string) => 'HASHED'),
  compare: jest.fn(async () => true),
}));

import * as db from '../lib/db';

describe('criarContaResponsavel', () => {
  afterEach(async () => {
    jest.restoreAllMocks();
    // Limpar dados criados nos testes
    await db.query(
      'DELETE FROM contratantes_senhas WHERE contratante_id = $1',
      [10]
    );
    await db.query(
      'DELETE FROM contratantes_senhas WHERE contratante_id = $1',
      [20]
    );
    await db.query('DELETE FROM contratantes WHERE id IN ($1,$2)', [10, 20]);
  });

  test('cria senha para entidade e NÃO cria funcionario (responsável não é funcionário)', async () => {
    const contratante = {
      id: 10,
      tipo: 'entidade',
      responsavel_cpf: '12345678901',
      responsavel_nome: 'Resp',
      responsavel_email: 'a@b.com',
      cnpj: '12.345.678/0001-90',
    } as any;

    // Inserir contratante no banco de testes (requer colunas NOT NULL)
    await db.query(
      `INSERT INTO contratantes (id, tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, status, ativa)
       VALUES ($1, 'entidade', $2, $3, $4, '11999999999', 'Rua Teste', 'Cidade', 'SP', '00000-000', $5, $6, $7, '11999999999', 'aprovado', false)`,
      [
        10,
        'Entidade Teste',
        contratante.cnpj,
        'entidade@teste.com',
        contratante.responsavel_nome,
        contratante.responsavel_cpf,
        contratante.responsavel_email,
      ]
    );

    await expect(db.criarContaResponsavel(contratante)).resolves.not.toThrow();

    // Verificar registro em contratantes_senhas
    const senhaRows = (
      await db.query(
        'SELECT cpf, senha_hash FROM contratantes_senhas WHERE contratante_id = $1',
        [10]
      )
    ).rows;
    expect(senhaRows.length).toBe(1);
    expect(senhaRows[0].cpf).toBe('12345678901');
    expect(senhaRows[0].senha_hash).toMatch(/HASHED|\$2[aby]\$/);

    // Não deve ter criado um registro em funcionarios para o responsável
    const func = (
      await db.query('SELECT * FROM funcionarios WHERE cpf = $1', [
        contratante.responsavel_cpf,
      ])
    ).rows;
    expect(func.length).toBe(0);
  });

  test('senha inicial deve ter flag primeira_senha_alterada = false por padrão', async () => {
    // Inserir contratante de teste
    const contratante = {
      id: 30,
      tipo: 'entidade',
      responsavel_cpf: '32165498700',
      responsavel_nome: 'Inicial Test',
      responsavel_email: 'init@test.com',
      cnpj: '11.222.333/0001-44',
    } as any;

    await db.query(
      `INSERT INTO contratantes (id, tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, status, ativa)
       VALUES ($1, 'entidade', $2, $3, $4, '11999999977', 'Rua Teste', 'Cidade', 'SP', '00000-002', $5, $6, $7, '11999999977', 'aprovado', false)`,
      [
        30,
        'Entidade Inicial',
        contratante.cnpj,
        'entidade-init@test.com',
        contratante.responsavel_nome,
        contratante.responsavel_cpf,
        contratante.responsavel_email,
      ]
    );

    await expect(db.criarContaResponsavel(contratante)).resolves.not.toThrow();

    const row = (
      await db.query(
        'SELECT primeira_senha_alterada FROM contratantes_senhas WHERE contratante_id = $1',
        [30]
      )
    ).rows[0];

    // Por padrão (migrations) deve ser false
    expect(row.primeira_senha_alterada).toBe(false);

    // Limpeza
    await db.query(
      'DELETE FROM contratantes_senhas WHERE contratante_id = $1',
      [30]
    );
    await db.query('DELETE FROM contratantes WHERE id = $1', [30]);
  });

  test('atualiza funcionario existente para clinica com perfil rh', async () => {
    // Inserir funcionario existente para simular atualização
    await db.query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, clinica_id, ativo) VALUES ($1,$2,$3,$4,'rh', $5, false) ON CONFLICT (cpf) DO NOTHING`,
      ['10987654321', 'ClinGest Antigo', 'c@d.com', 'OLDHASH', null]
    );

    // Executar criando conta contra o DB de teste (integração leve)
    await db.criarContaResponsavel(contratante);

    // Verificar que o funcionario foi atualizado
    const func = (
      await db.query(
        'SELECT perfil, senha_hash FROM funcionarios WHERE cpf = $1',
        ['10987654321']
      )
    ).rows[0];
    expect(func.perfil).toBe('rh');
    expect(func.senha_hash).toMatch(/HASHED|\$2[aby]\$/); // funcCheck

    const contratante = {
      id: 20,
      tipo: 'clinica',
      responsavel_cpf: '10987654321',
      responsavel_nome: 'ClinGest',
      responsavel_email: 'c@d.com',
      cnpj: '00.000.000/0001-00',
    } as any;

    // Inserir contratante de clínica no banco de testes
    await db.query(
      `INSERT INTO contratantes (id, tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, status, ativa)
       VALUES ($1, 'clinica', $2, $3, $4, '11999999998', 'Rua Teste', 'Cidade', 'SP', '00000-001', $5, $6, $7, '11999999998', 'aprovado', false)`,
      [
        20,
        'Clinica Teste',
        contratante.cnpj,
        'clinica@teste.com',
        contratante.responsavel_nome,
        contratante.responsavel_cpf,
        contratante.responsavel_email,
      ]
    );

    await expect(db.criarContaResponsavel(contratante)).resolves.not.toThrow();

    const updateCall = mockQuery.mock.calls.find((call: any) =>
      String(call[0]).startsWith('UPDATE funcionarios')
    );
    expect(updateCall).toBeDefined();
    // params: [nome, email, perfilToSet, contratante.id, hashed, fid]
    expect(updateCall![1][2]).toBe('rh');
  });

  test('responsável de entidade NÃO deve ser criado como funcionario (vínculo não deve existir)', async () => {
    const contratante = {
      id: 11,
      tipo: 'entidade',
      responsavel_cpf: '44444444444',
      responsavel_nome: 'Vinc Test',
      responsavel_email: 'vinc@test.com',
      cnpj: '99.999.999/0001-01',
    } as any;

    await db.query(
      `INSERT INTO contratantes (id, tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, status, ativa)
       VALUES ($1, 'entidade', $2, $3, $4, '11999990000', 'Rua Teste', 'Cidade', 'SP', '00000-111', $5, $6, $7, '11999990000', 'aprovado', false)`,
      [
        11,
        'Entidade Vinculo',
        contratante.cnpj,
        'vinc@teste.com',
        contratante.responsavel_nome,
        contratante.responsavel_cpf,
        contratante.responsavel_email,
      ]
    );

    await expect(db.criarContaResponsavel(contratante)).resolves.not.toThrow();

    const func = (
      await db.query('SELECT id FROM funcionarios WHERE cpf = $1', [
        contratante.responsavel_cpf,
      ])
    ).rows;

    expect(func.length).toBe(0);

    const vinc = (
      await db.query(
        'SELECT * FROM contratantes_funcionarios WHERE contratante_id = $1',
        [11]
      )
    ).rows;

    expect(vinc.length).toBe(0);

    // Cleanup
    await db.query(
      'DELETE FROM contratantes_senhas WHERE contratante_id = $1',
      [11]
    );
    await db.query('DELETE FROM contratantes WHERE id = $1', [11]);
  });

  test('quando responsavel_cpf ausente, cria senha em contratantes_senhas com CPF igual ao CNPJ limpo e não cria funcionario', async () => {
    const contratante = {
      id: 40,
      tipo: 'entidade',
      responsavel_cpf: null,
      responsavel_nome: 'NoCPF',
      responsavel_email: 'nocpf@test.com',
      cnpj: '22.333.444/0001-55',
    } as any;

    await db.query(
      `INSERT INTO contratantes (id, tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, status, ativa)
       VALUES ($1, 'entidade', $2, $3, $4, '11999990001', 'Rua Teste', 'Cidade', 'SP', '00000-222', $5, $6, $7, '11999990001', 'aprovado', false)`,
      [
        40,
        'Entidade NoCPF',
        contratante.cnpj,
        'nocpf@teste.com',
        contratante.responsavel_nome,
        contratante.responsavel_cpf,
        contratante.responsavel_email,
      ]
    );

    // Não deve lançar
    await expect(db.criarContaResponsavel(contratante)).resolves.not.toThrow();

    const cleanCnpj = contratante.cnpj.replace(/\D/g, '');

    const senhaRow = (
      await db.query(
        'SELECT cpf FROM contratantes_senhas WHERE contratante_id = $1',
        [40]
      )
    ).rows[0];

    expect(senhaRow).toBeDefined();
    expect(senhaRow.cpf).toBe(cleanCnpj);

    const func = (
      await db.query('SELECT * FROM funcionarios WHERE cpf = $1', [cleanCnpj])
    ).rows;

    // Atualmente o fluxo não cria funcionário se não houver responsavel_cpf explícito
    expect(func.length).toBe(0);

    // Cleanup
    await db.query(
      'DELETE FROM contratantes_senhas WHERE contratante_id = $1',
      [40]
    );
    await db.query('DELETE FROM contratantes WHERE id = $1', [40]);
  });
});
