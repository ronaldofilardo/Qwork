import { loadEnv } from './load-env';
import { getDatabaseInfo, testConnection } from '../lib/db';

loadEnv();

async function main() {
  console.log('[DB-INFO]', getDatabaseInfo());
  const ok = await testConnection();
  console.log('[DB-TEST-CONN] OK?', ok);
  process.exit(ok ? 0 : 1);
}

main();
