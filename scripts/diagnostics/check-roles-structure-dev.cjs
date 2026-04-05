'use strict';
const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
  });
  await client.connect();

  // Estrutura da tabela roles
  const roles = await client.query('SELECT * FROM roles ORDER BY id');
  console.log('=== roles ===');
  console.log(JSON.stringify(roles.rows, null, 2));

  // Estrutura de role_permissions
  const rp = await client.query(
    'SELECT * FROM role_permissions ORDER BY role_id'
  );
  console.log('=== role_permissions ===');
  console.log(JSON.stringify(rp.rows, null, 2));

  // Estrutura de permissions
  const perms = await client.query('SELECT * FROM permissions ORDER BY id');
  console.log('=== permissions ===');
  console.log(JSON.stringify(perms.rows, null, 2));

  // Verificar se existe tabela usuario_roles ou users_roles
  const urTables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%usuario%role%' OR table_name ILIKE '%user%role%'"
  );
  console.log('=== usuario_roles tables ===', urTables.rows);

  // FK: quem referencia roles?
  const fk = await client.query(
    "SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name=ccu.constraint_name WHERE tc.constraint_type='FOREIGN KEY' AND ccu.table_name='roles'"
  );
  console.log('=== tables FK -> roles ===');
  console.log(JSON.stringify(fk.rows, null, 2));

  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
