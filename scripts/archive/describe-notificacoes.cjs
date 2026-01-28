const { Client } = require('pg');
const client = new Client({
  connectionString:
    process.env.TEST_DATABASE_URL ||
    'postgres://postgres:123456@localhost:5432/nr-bps_db_test',
});
(async () => {
  await client.connect();
  const res = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='notificacoes' ORDER BY ordinal_position`
  );
  console.log(res.rows);
  await client.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
