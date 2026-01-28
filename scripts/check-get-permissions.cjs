const { Client } = require('pg');
const client = new Client({
  connectionString:
    process.env.TEST_DATABASE_URL ||
    'postgres://postgres:123456@localhost:5432/nr-bps_db_test',
});

async function run() {
  await client.connect();
  const res = await client.query(
    `SELECT p.name
     FROM role_permissions rp
     JOIN roles r ON r.id = rp.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE r.name = $1`,
    ['funcionario']
  );
  console.log(res.rows);
  await client.end();
}

run().catch(console.error);
