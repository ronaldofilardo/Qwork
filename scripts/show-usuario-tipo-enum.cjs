require('dotenv').config({path:'.env.test'});
const { Client } = require('pg');
(async () => {
  const client = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await client.connect();
    const r = await client.query("SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname='usuario_tipo_enum' ORDER BY enumlabel");
    console.log('usuario_tipo_enum:', r.rows.map(r => r.enumlabel));
    await client.end();
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
