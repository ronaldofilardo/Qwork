require('dotenv').config({ path: '.env.test' });
const { Client } = require('pg');
(async () => {
  try {
    const c = new Client({ connectionString: process.env.TEST_DATABASE_URL });
    await c.connect();
    const r = await c.query(
      "SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name='contratantes' ORDER BY ordinal_position"
    );
    console.log('contratantes columns:');
    console.log(r.rows);
    await c.end();
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
