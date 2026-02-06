require('dotenv').config({ path: '.env.test' });
const { Client } = require('pg');
(async () => {
  const client = new Client({
    connectionString: process.env.TEST_DATABASE_URL,
  });
  try {
    await client.connect();
    const r = await client.query(
      "SELECT definition FROM pg_views WHERE viewname='gestores'"
    );
    console.log('gestores definition:', r.rows[0]?.definition);
    await client.end();
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
