#!/usr/bin/env node

/**
 * Teste Simples de Sequência Contínua de IDs
 * 
 * Este é um teste NODAL simples que valida a sequência contínua
 * entre entidades e clínicas sem complexidade de Jest/RLS.
 */

const { Pool } = require('pg');
const assert = require('assert');

const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 
    'postgresql://postgres:123456@localhost:5432/nr-bps_db_test',
});

const queryWithAdmin = async (text, params = []) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL app.current_user_cpf = '00000000000'");
    await client.query("SET LOCAL app.current_user_perfil = 'admin'");
    const result = await client.query(text, params);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

async function runTests() {
  console.log('🔍 Testando Sequência Contínua de IDs...\n');

  try {
    // Limpar dados
    console.log('1️⃣ Limpando banco de dados...');
    await queryWithAdmin('TRUNCATE TABLE clinicas CASCADE');
    await queryWithAdmin('TRUNCATE TABLE entidades CASCADE');
    await queryWithAdmin('ALTER SEQUENCE seq_contratantes_id RESTART WITH 1');
    console.log('✅ Banco preparado\n');

    // Teste 1: ID=1 para entidade
    console.log('2️⃣ Inserindo primeira entidade (esperado ID=1)...');
    const ent1 = await queryWithAdmin(`
      INSERT INTO entidades (
        nome, cnpj, email, telefone, endereco, cidade, 
        estado, cep, responsavel_nome, responsavel_cpf, 
        responsavel_email, responsavel_celular, ativa, tipo
      )
      VALUES (
        'Entidade 1', '12345678901234', 'ent1@t.com', '1111', 
        'R1', 'C1', 'SP', '01000001', 'R1', '11111111111', 
        'r1@t.com', '11999999991', true, 'entidade'
      )
      RETURNING id
    `);
    assert.strictEqual(ent1.rows[0].id, 1, `Esperado ID=1, obtido ${ent1.rows[0].id}`);
    console.log('✅ Entidade criada com ID=1\n');

    // Teste 2: ID=2 para clínica
    console.log('3️⃣ Inserindo primeira clínica (esperado ID=2)...');
    const cli1 = await queryWithAdmin(`
      INSERT INTO clinicas (
        nome, cnpj, email, telefone, endereco, cidade, 
        estado, cep, responsavel_nome, responsavel_cpf, 
        responsavel_email, responsavel_celular, ativa, tipo
      )
      VALUES (
        'Clínica 1', '22222222222222', 'cli1@t.com', '2222', 
        'Av1', 'C2', 'RJ', '20000002', 'R2', '22222222222', 
        'r2@t.com', '21999999992', true, 'clinica'
      )
      RETURNING id
    `);
    assert.strictEqual(cli1.rows[0].id, 2, `Esperado ID=2, obtido ${cli1.rows[0].id}`);
    console.log('✅ Clínica criada com ID=2\n');

    // Teste 3: ID=3 para segunda entidade
    console.log('4️⃣ Inserindo segunda entidade (esperado ID=3)...');
    const ent2 = await queryWithAdmin(`
      INSERT INTO entidades (
        nome, cnpj, email, telefone, endereco, cidade, 
        estado, cep, responsavel_nome, responsavel_cpf, 
        responsavel_email, responsavel_celular, ativa, tipo
      )
      VALUES (
        'Entidade 2', '33333333333333', 'ent2@t.com', '3333', 
        'R2', 'C3', 'MG', '30000003', 'R3', '33333333333', 
        'r3@t.com', '31999999993', true, 'entidade'
      )
      RETURNING id
    `);
    assert.strictEqual(ent2.rows[0].id, 3, `Esperado ID=3, obtido ${ent2.rows[0].id}`);
    console.log('✅ Entidade criada com ID=3\n');

    // Teste 4: ID=4 para segunda clínica
    console.log('5️⃣ Inserindo segunda clínica (esperado ID=4)...');
    const cli2 = await queryWithAdmin(`
      INSERT INTO clinicas (
        nome, cnpj, email, telefone, endereco, cidade, 
        estado, cep, responsavel_nome, responsavel_cpf, 
        responsavel_email, responsavel_celular, ativa, tipo
      )
      VALUES (
        'Clínica 2', '44444444444444', 'cli2@t.com', '4444', 
        'Av2', 'C4', 'DF', '70000004', 'R4', '44444444444', 
        'r4@t.com', '61999999994', true, 'clinica'
      )
      RETURNING id
    `);
    assert.strictEqual(cli2.rows[0].id, 4, `Esperado ID=4, obtido ${cli2.rows[0].id}`);
    console.log('✅ Clínica criada com ID=4\n');

    // Teste 5: Verificar sequência contínua
    console.log('6️⃣ Verificando sequência contínua...');
    const allIds = await queryWithAdmin(`
      SELECT id, tipo FROM entidades
      UNION ALL
      SELECT id, tipo FROM clinicas
      ORDER BY id
    `);

    assert.strictEqual(allIds.rows.length, 4, `Esperado 4 registros, obtido ${allIds.rows.length}`);
    const ids = allIds.rows.map(r => r.id);
    assert.deepStrictEqual(ids, [1, 2, 3, 4], `IDs não estão em sequência: ${ids}`);
    console.log('✅ Sequência contínua validada: ' + ids.join(' → ') + '\n');

    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Os IDs são contínuos entre entidades e clínicas');
    console.log('   Entidade → ID=1, Clínica → ID=2, Entidade → ID=3, Clínica → ID=4\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\nDetalhes:', error);
    await pool.end();
    process.exit(1);
  }
}

runTests();
