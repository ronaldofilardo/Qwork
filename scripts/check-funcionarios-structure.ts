#!/usr/bin/env tsx
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

async function main() {
  const cols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name='funcionarios'
    ORDER BY ordinal_position
  `);

  console.log('\nESTRUTURA DA TABELA FUNCIONARIOS:\n');
  for (const row of cols.rows) {
    console.log(`  ${row.column_name.padEnd(30)} ${row.data_type}`);
  }

  // Verificar FKs
  console.log('\n\nFOREIGN KEYS:\n');
  const fks = await pool.query(`
    SELECT
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name='funcionarios'
  `);

  for (const row of fks.rows) {
    console.log(
      `  ${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`
    );
  }

  await pool.end();
}

main();
