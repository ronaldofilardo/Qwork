const { Client } = require('pg');

async function checkVersions(name, url) {
  const c = new Client({ connectionString: url, connectionTimeoutMillis: 20000 });
  await c.connect();
  const r = await c.query('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 30');
  console.log(name + ':', r.rows.map(x => x.version).join(', '));
  await c.end();
}

const stagingUrl = 'postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_staging?sslmode=require';
const prodUrl = 'postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_v2?sslmode=require';

Promise.all([
  checkVersions('STAGING', stagingUrl),
  checkVersions('PROD', prodUrl),
]).catch(e => { console.error(e.message); process.exit(1); });
