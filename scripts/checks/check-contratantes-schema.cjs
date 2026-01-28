require('dotenv').config({ path: '.env.local' });
const { query } = require('../../lib/db');

(async () => {
  const r = await query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'contratantes' ORDER BY ordinal_position"
  );
  console.log(
    'Colunas de contratantes:',
    r.rows.map((x) => x.column_name).join(', ')
  );
})().catch((e) => console.error(e.message));
