#!/usr/bin/env tsx
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

(async () => {
  const r = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name='laudos' 
    ORDER BY ordinal_position
  `);

  console.log('ESTRUTURA DA TABELA LAUDOS:\n');
  r.rows.forEach((c) =>
    console.log(`  ${c.column_name.padEnd(35)} ${c.data_type}`)
  );

  console.log('\n\nDADOS DOS LAUDOS:\n');
  const laudos = await pool.query('SELECT * FROM laudos ORDER BY id');
  laudos.rows.forEach((l) => {
    console.log(`Laudo ID ${l.id}: ${l.numero_laudo}`);
    console.log(`  funcionario_id: ${l.funcionario_id}`);
    console.log(`  lote_id: ${l.lote_id || 'NULL'}`);
    console.log('');
  });

  await pool.end();
})();
