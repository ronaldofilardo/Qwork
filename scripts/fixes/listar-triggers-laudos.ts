import { query } from '../../lib/db';

async function listarTriggers() {
  const result = await query(`
    SELECT 
      trigger_name,
      event_manipulation,
      action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'laudos'
    ORDER BY trigger_name
  `);

  console.log('Triggers da tabela laudos:\n');
  console.table(result.rows);
  process.exit(0);
}

listarTriggers();
