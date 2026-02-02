import { config } from 'dotenv';
import { getDatabaseInfo, testConnection } from '../lib/db';

config({ path: '.env.local' });

async function main() {
  console.log('[DB-INFO]', getDatabaseInfo());
  const ok = await testConnection();
  console.log('[DB-TEST-CONN] OK?', ok);
  process.exit(ok ? 0 : 1);
}

main();
