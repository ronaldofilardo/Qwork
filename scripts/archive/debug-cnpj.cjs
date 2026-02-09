const { Client } = require('pg');
const connectionString =
  process.env.TEST_DATABASE_URL ||
  'postgres://postgres:123456@localhost:5432/nr-bps_db_test';
const client = new Client({ connectionString });

async function run() {
  await client.connect();
  const cnpj = process.argv[2] || '99999999000101';
  const cont = await client.query(
    "SELECT id, cnpj, status, ativa FROM tomadores WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = $1",
    [cnpj]
  );
  console.log('contratante rows:', cont.rows);
  const pagos = await client.query(
    'SELECT * FROM pagamentos WHERE contratante_id = $1 ORDER BY data_pagamento DESC',
    [cont.rows[0]?.id]
  );
  console.log('pagamentos:', pagos.rows);
  await client.end();
}

run().catch(console.error);
