require('dotenv').config({ path: '.env.test' });
const { Client } = require('pg');
(async () => {
  const client = new Client({
    connectionString: process.env.TEST_DATABASE_URL,
  });
  try {
    await client.connect();
    const r = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='gestores' ORDER BY ordinal_position"
    );
    console.log(
      'gestores columns:',
      r.rows.map((r) => r.column_name)
    );
    const vals = await client.query(
      'SELECT DISTINCT usuario_tipo FROM gestores'
    );
    console.log(
      'distinct usuario_tipo in gestores:',
      vals.rows.map((r) => r.usuario_tipo)
    );
    await client.end();
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
