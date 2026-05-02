const { Client } = require('pg');

async function checkVersions(name, url) {
  const c = new Client({ connectionString: url, connectionTimeoutMillis: 20000 });
  await c.connect();
  const r = await c.query('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 30');
  console.log(name + ':', r.rows.map(x => x.version).join(', '));
  await c.end();
}

const stagingUrl = process.env.STAGING_DATABASE_URL;
const prodUrl = process.env.DATABASE_URL;

Promise.all([
  checkVersions('STAGING', stagingUrl),
  checkVersions('PROD', prodUrl),
]).catch(e => { console.error(e.message); process.exit(1); });
