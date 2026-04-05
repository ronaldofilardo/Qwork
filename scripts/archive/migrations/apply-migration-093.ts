import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import { Client } from 'pg';

(async () => {
  const sql = fs.readFileSync(
    'database/migrations/093_allow_null_emissor_on_laudos.sql',
    'utf-8'
  );
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('[MIGRATE-093] Applying migration 093...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[MIGRATE-093] Migration applied successfully');
  } catch (err) {
    console.error('[MIGRATE-093] Migration failed:', err);
    try {
      await client.query('ROLLBACK');
    } catch (e) {}
    process.exit(2);
  } finally {
    await client.end();
  }
})();
