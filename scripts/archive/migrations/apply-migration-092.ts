import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import { Client } from 'pg';

(async () => {
  const sql = fs.readFileSync(
    'database/migrations/092_fix_legacy_emissor_update.sql',
    'utf-8'
  );
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('[MIGRATE-092] Applying migration 092...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[MIGRATE-092] Migration applied successfully');
  } catch (err) {
    console.error('[MIGRATE-092] Migration failed:', err);
    try {
      await client.query('ROLLBACK');
    } catch (e) {}
    process.exit(2);
  } finally {
    await client.end();
  }
})();
