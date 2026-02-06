require('dotenv').config({ path: '.env.test' });
const { Client } = require('pg');
(async () => {
  const client = new Client({
    connectionString: process.env.TEST_DATABASE_URL,
  });
  try {
    await client.connect();
    const r = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='usuarios' ORDER BY ordinal_position"
    );
    console.log(
      'usuarios columns:',
      r.rows.map((r) => r.column_name)
    );
    await client.end();
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
