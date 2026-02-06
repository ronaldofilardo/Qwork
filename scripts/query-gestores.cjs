require('dotenv').config({ path: '.env.test' });
const { Client } = require('pg');
(async () => {
  const client = new Client({
    connectionString: process.env.TEST_DATABASE_URL,
  });
  try {
    await client.connect();
    const r = await client.query(
      'SELECT DISTINCT usuario_tipo FROM gestores ORDER BY usuario_tipo'
    );
    console.log(
      'gestores usuario_tipo:',
      r.rows.map((r) => r.usuario_tipo)
    );
    await client.end();
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
