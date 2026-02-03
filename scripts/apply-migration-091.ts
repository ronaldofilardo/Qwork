import { config } from 'dotenv';
import { loadEnv } from './load-env';
loadEnv();

import fs from 'fs';
import { Client } from 'pg';

(async () => {
  const sql = fs.readFileSync(
    'database/migrations/091_remove_legacy_emissor_default.sql',
    'utf-8'
  );
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('[MIGRATE-091] Applying migration 091...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[MIGRATE-091] Migration applied successfully');
  } catch (err) {
    console.error('[MIGRATE-091] Migration failed:', err);
    try {
      await client.query('ROLLBACK');
    } catch (e) {}
    process.exit(2);
  } finally {
    await client.end();
  }
})();
