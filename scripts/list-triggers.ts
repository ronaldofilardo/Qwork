#!/usr/bin/env tsx
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

(async () => {
  const r = await pool.query(`
    SELECT tgname, tgenabled 
    FROM pg_trigger 
    WHERE tgrelid = 'lotes_avaliacao'::regclass 
      AND tgname NOT LIKE 'RI_%'
  `);

  console.log('TRIGGERS em lotes_avaliacao:\n');
  r.rows.forEach((t) => {
    console.log(
      `  ${t.tgname} (${t.tgenabled === 'O' ? 'ENABLED' : 'DISABLED'})`
    );
  });

  await pool.end();
})();
