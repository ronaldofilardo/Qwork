const { Client } = require('pg');
const client = new Client({
  connectionString:
    process.env.TEST_DATABASE_URL ||
    'postgres://postgres:123456@localhost:5432/nr-bps_db_test',
});

async function run() {
  await client.connect();
  const roles = await client.query('SELECT id, name FROM roles');
  console.log('roles', roles.rows);
  const perms = await client.query('SELECT id, name FROM permissions');
  console.log('permissions', perms.rows.slice(0, 50));
  const rps = await client.query(
    'SELECT r.name as role, p.name as perm FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id;'
  );
  console.log('role_permissions', rps.rows.slice(0, 50));
  await client.end();
}
run().catch(console.error);
