const { Client } = require('pg');

// Ajuste a connectionString se precisar apontar para outro banco
const connectionString =
  process.env.LOCAL_DATABASE_URL ||
  'postgres://postgres:123456@localhost:5432/nr-bps_db';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  const cnpj = '41877277000184';

  try {
    const contratante = await client.query(
      `SELECT * FROM tomadores WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = $1 LIMIT 1`,
      [cnpj]
    );
    console.log('Contratante:', contratante.rows[0]);

    const contratos = await client.query(
      `SELECT * FROM contratos WHERE contratante_id = $1 ORDER BY criado_em DESC LIMIT 5`,
      [contratante.rows[0] ? contratante.rows[0].id : null]
    );
    console.log('Contratos:', contratos.rows);

    const contratos_planos = await client.query(
      `SELECT * FROM contratos_planos WHERE contratante_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [contratante.rows[0] ? contratante.rows[0].id : null]
    );
    console.log('Contratos Planos:', contratos_planos.rows);

    const pagamentos = await client.query(
      `SELECT * FROM pagamentos WHERE contratante_id = $1 ORDER BY data_pagamento DESC, criado_em DESC LIMIT 10`,
      [contratante.rows[0] ? contratante.rows[0].id : null]
    );
    console.log('Pagamentos (recentes):', pagamentos.rows);
  } catch (err) {
    console.error('Erro na query:', err);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
