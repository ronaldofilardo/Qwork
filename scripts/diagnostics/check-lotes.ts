#!/usr/bin/env tsx
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

(async () => {
  console.log('ESTRUTURAS DAS TABELAS:\n');

  // Lotes
  console.log('1️⃣  lotes_avaliacao:\n');
  const lotesStruct = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name='lotes_avaliacao' 
    ORDER BY ordinal_position
  `);
  lotesStruct.rows.forEach((c) => console.log(`   ${c.column_name}`));

  const lotes = await pool.query('SELECT * FROM lotes_avaliacao ORDER BY id');
  console.log(`\n   Total: ${lotes.rows.length} registros\n`);
  lotes.rows.forEach((l) => {
    console.log(JSON.stringify(l, null, 2));
  });

  await pool.end();
})();
