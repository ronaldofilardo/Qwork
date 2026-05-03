require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});
c.connect()
  .then(() => c.query('SELECT version FROM schema_migrations ORDER BY version'))
  .then((r) => {
    console.log('ALL:', r.rows.map((x) => x.version).join(', '));
    return c.end();
  })
  .catch((e) => console.error('ERR:', e.message));
