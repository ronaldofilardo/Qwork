/**
 * Testes de Sequência Contínua de IDs
 * Valida que entidades e clínicas compartilham a mesma sequência (seq_contratantes_id)
 * e geram IDs contínuos: Entidade=1, Clínica=2, Entidade=3, Clínica=4, etc.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString:
    process.env.TEST_DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db_test',
});

const queryWithAdminContext = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Configurar contexto de admin para bypasser RLS
    await client.query("SET LOCAL app.current_user_cpf = '00000000000'");
    await client.query("SET LOCAL app.current_user_perfil = 'admin'");
    const result = await client.query(text, params);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

describe('Sequência Contínua de IDs (entidades + clínicas)', () => {
  beforeEach(async () => {
    // Limpar dados antes de cada teste
    try {
      await queryWithAdminContext('TRUNCATE TABLE clinicas CASCADE');
      await queryWithAdminContext('TRUNCATE TABLE entidades CASCADE');
      await queryWithAdminContext(
        'ALTER SEQUENCE seq_contratantes_id RESTART WITH 1'
      );
    } catch (error) {
      console.error('Erro ao limpar:', error);
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  it('deve começar com ID=1 para primeira entidade', async () => {
    const result = await queryWithAdminContext(`
      INSERT INTO entidades (
        nome, cnpj, email, telefone, endereco, cidade, 
        estado, cep, responsavel_nome, responsavel_cpf, 
        responsavel_email, responsavel_celular, ativa, tipo
      )
      VALUES (
        'Entidade Teste 1',
        '12345678901234',
        'entidade1@teste.com',
        '1111111111',
        'Rua Teste, 123',
        'São Paulo',
        'SP',
        '01234567',
        'Responsável 1',
        '12345678901',
        'resp1@teste.com',
        '11999999999',
        true,
        'entidade'
      )
      RETURNING id
    `);

    expect(result.rows[0].id).toBe(1);
  });

  it('deve ter ID=2 para primeira clínica', async () => {
    // Primeiro inserir uma entidade para gerar ID=1
    await queryWithAdminContext(`
      INSERT INTO entidades (
        nome, cnpj, email, telefone, endereco, cidade, 
        estado, cep, responsavel_nome, responsavel_cpf, 
        responsavel_email, responsavel_celular, ativa, tipo
      )
      VALUES (
        'Entidade Teste',
        '12345678901234',
        'entidade@teste.com',
        '1111111111',
        'Rua Teste, 123',
        'São Paulo',
        'SP',
        '01234567',
        'Responsável',
        '12345678901',
        'resp@teste.com',
        '11999999999',
        true,
        'entidade'
      )
    `);

    const result = await queryWithAdminContext(`
      INSERT INTO clinicas (
        nome, cnpj, email, telefone, endereco, cidade, 
        estado, cep, responsavel_nome, responsavel_cpf, 
        responsavel_email, responsavel_celular, ativa, tipo
      )
      VALUES (
        'Clínica Teste 1',
        '98765432101234',
        'clinica1@teste.com',
        '2222222222',
        'Av. Teste, 456',
        'Rio de Janeiro',
        'RJ',
        '20000000',
        'Responsável Clínica 1',
        '98765432101',
        'respClinica1@teste.com',
        '21999999999',
        true,
        'clinica'
      )
      RETURNING id
    `);

    expect(result.rows[0].id).toBe(2);
  });

  it('alternância entre entidades e clínicas deve gerar IDs contínuos', async () => {
    // ID=1 (Entidade)
    const ent1 = await queryWithAdminContext(`
      INSERT INTO entidades (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, tipo)
      VALUES ('Ent 1', '11111111111111', 'ent1@t.com', '1111', 'R1', 'C1', 'SP', '01000001', 'R1', '11111111111', 'r1@t.com', '11999999991', true, 'entidade')
      RETURNING id
    `);
    expect(ent1.rows[0].id).toBe(1);

    // ID=2 (Clínica)
    const cli1 = await queryWithAdminContext(`
      INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, tipo)
      VALUES ('Cli 1', '22222222222222', 'c1@t.com', '2222', 'Av1', 'C2', 'RJ', '20000002', 'R2', '22222222222', 'r2@t.com', '21999999992', true, 'clinica')
      RETURNING id
    `);
    expect(cli1.rows[0].id).toBe(2);

    // ID=3 (Entidade)
    const ent2 = await queryWithAdminContext(`
      INSERT INTO entidades (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, tipo)
      VALUES ('Ent 2', '33333333333333', 'ent2@t.com', '3333', 'R2', 'C3', 'MG', '30000003', 'R3', '33333333333', 'r3@t.com', '31999999993', true, 'entidade')
      RETURNING id
    `);
    expect(ent2.rows[0].id).toBe(3);

    // ID=4 (Clínica)
    const cli2 = await queryWithAdminContext(`
      INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, tipo)
      VALUES ('Cli 2', '44444444444444', 'c2@t.com', '4444', 'Av2', 'C4', 'DF', '70000004', 'R4', '44444444444', 'r4@t.com', '61999999994', true, 'clinica')
      RETURNING id
    `);
    expect(cli2.rows[0].id).toBe(4);

    // Verificar sequência contínua
    const allIds = await queryWithAdminContext(`
      SELECT id, 'entidade' as tipo FROM entidades
      UNION ALL
      SELECT id, 'clinica' FROM clinicas
      ORDER BY id
    `);

    expect(allIds.rows.length).toBe(4);
    expect(allIds.rows.map((r: any) => r.id)).toEqual([1, 2, 3, 4]);
  });
});
