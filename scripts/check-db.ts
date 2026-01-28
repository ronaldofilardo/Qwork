import { config } from 'dotenv';
import { getDatabaseInfo, testConnection } from '../lib/db';

config({ path: '.env.development' });

async function main() {
  console.log('[DB-INFO]', getDatabaseInfo());
  const ok = await testConnection();
  console.log('[DB-TEST-CONN] OK?', ok);
}

main();