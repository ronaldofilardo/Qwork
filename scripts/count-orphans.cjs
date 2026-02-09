require('dotenv').config({ path: '.env.test' });
const { Client } = require('pg');
(async () => {
  const client = new Client({
    connectionString: process.env.TEST_DATABASE_URL,
  });
  try {
    await client.connect();
    const r = await client.query(
      'SELECT COUNT(*) as orphans FROM funcionarios f LEFT JOIN tomadores c ON f.contratante_id = c.id WHERE f.contratante_id IS NOT NULL AND c.id IS NULL'
    );
    console.log('funcionarios orphans:', r.rows[0].orphans);

    const r2 = await client.query(
      'SELECT COUNT(*) as orphans FROM lotes_avaliacao l LEFT JOIN tomadores c ON l.contratante_id = c.id WHERE l.contratante_id IS NOT NULL AND c.id IS NULL'
    );
    console.log('lotes orphans:', r2.rows[0].orphans);

    const r3 = await client.query(
      'SELECT COUNT(*) as orphans FROM empresas_clientes e LEFT JOIN clinicas c ON e.clinica_id = c.id WHERE e.clinica_id IS NOT NULL AND c.id IS NULL'
    );
    console.log('empresas-clinicas orphans:', r3.rows[0].orphans);

    await client.end();
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
