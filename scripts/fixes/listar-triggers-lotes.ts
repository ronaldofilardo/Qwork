import dotenv from 'dotenv';
import { loadEnv } from '../load-env';
loadEnv();
import { query } from '@/lib/db';

async function main() {
  console.log('Listando triggers em lotes_avaliacao...\n');

  const result = await query(`
    SELECT 
      tgname as trigger_name,
      tgtype::int & 1 != 0 as for_row,
      tgtype::int & 2 != 0 as before,
      tgtype::int & 4 != 0 as after,
      tgtype::int & 16 != 0 as for_update,
      tgtype::int & 8 != 0 as for_delete,
      tgtype::int & 4 != 0 as for_insert,
      tgenabled,
      tgconstraint != 0 as is_constraint
    FROM pg_trigger
    WHERE tgrelid = 'lotes_avaliacao'::regclass
    AND tgisinternal = false
    ORDER BY tgname
  `);

  console.log('Triggers USER (não-sistema):');
  console.table(result.rows);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro:', err);
    process.exit(1);
  });
