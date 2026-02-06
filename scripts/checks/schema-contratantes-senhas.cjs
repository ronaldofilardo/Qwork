require('dotenv').config({ path: '.env.local' });
const { query } = require('../../lib/db');

(async () => {
  try {
    const r = await query(
      "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='entidades_senhas' ORDER BY ordinal_position"
    );
    console.log(r.rows);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
