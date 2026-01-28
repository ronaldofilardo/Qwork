const { Client } = require('pg');
const client = new Client({
  connectionString:
    process.env.TEST_DATABASE_URL ||
    'postgres://postgres:123456@localhost:5432/nr-bps_db_test',
});
(async () => {
  await client.connect();
  const res = await client.query(
    `SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'tipo_notificacao' ORDER BY enumsortorder`
  );
  console.log(res.rows.map((r) => r.enumlabel));
  await client.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
