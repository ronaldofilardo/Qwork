require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const url = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || '';
const client = new Client({ connectionString: url });
client
  .connect()
  .then(async () => {
    const r = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'representantes' ORDER BY ordinal_position"
    );
    console.log('COLS:', r.rows.map((x) => x.column_name).join(', '));
    await client.end();
  })
  .catch((e) => {
    console.error('ERR:', e.message);
  });
