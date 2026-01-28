require('dotenv').config({ path: '.env.test' });
const { Pool } = require('pg');
(async () => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    const res = await pool.query(
      "SELECT column_name, data_type, ordinal_position FROM information_schema.columns WHERE table_name='contratos_planos' ORDER BY ordinal_position"
    );
    console.log('columns:', res.rows);
  } catch (err) {
    console.error('error querying:', err);
  } finally {
    await pool.end();
  }
})();
