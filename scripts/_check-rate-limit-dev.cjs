const { Client } = require('pg');
const c = new Client({ host: 'localhost', port: 5432, database: 'nr-bps_db', user: 'postgres', password: '123456' });
c.connect().then(async () => {
  const r1 = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'rate%'");
  console.log('tabelas rate*:', r1.rows.map(x => x.table_name).join(', ') || 'nenhuma');
  const r2 = await c.query("SELECT indexname, tablename FROM pg_indexes WHERE schemaname='public' AND tablename LIKE 'rate%'");
  console.log('indexes rate*:', r2.rows.map(x => x.indexname + '@' + x.tablename).join(', ') || 'nenhum');
  await c.end();
}).catch(e => console.error(e.message));
