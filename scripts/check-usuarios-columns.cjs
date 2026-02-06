/* check-usuarios-columns.cjs
   Verifica colunas da tabela usuarios em LOCAL_DATABASE_URL e DATABASE_URL
*/
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const urls = [
  ['LOCAL_DATABASE_URL', process.env.LOCAL_DATABASE_URL],
  ['DATABASE_URL', process.env.DATABASE_URL],
];

(async () => {
  for (const [name, conn] of urls) {
    console.log('\n== ' + name + ' ==');
    if (!conn) {
      console.log('  (not set)');
      continue;
    }
    const client = new Client({ connectionString: conn });
    try {
      await client.connect();
      const r = await client.query(
        "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='usuarios' ORDER BY ordinal_position"
      );
      if (!r.rows || r.rows.length === 0) {
        console.log('  table usuarios: not found or no columns');
      } else {
        for (const row of r.rows) {
          console.log(
            `  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`
          );
        }
      }
    } catch (e) {
      console.log('  ERROR ->', e.message);
    } finally {
      await client.end();
    }
  }
})();
