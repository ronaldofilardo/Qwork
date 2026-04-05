'use strict';
const { Client } = require('pg');

(async () => {
  const c = new Client({ connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db' });
  await c.connect();

  // tipo_usuario enum values
  const te = await c.query(
    "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid=pg_type.oid WHERE pg_type.typname='tipo_usuario' ORDER BY enumsortorder"
  );
  console.log('tipo_usuario enum values:', te.rows.map(r => r.enumlabel));

  // usuario* tables
  const ur = await c.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%usuario%'"
  );
  console.log('usuario* tables:', ur.rows.map(r => r.table_name));

  // FK tables pointing to usuarios
  const fk = await c.query(
    "SELECT DISTINCT tc.table_name, kcu.column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name=ccu.constraint_name WHERE tc.constraint_type='FOREIGN KEY' AND ccu.table_name='usuarios'"
  );
  console.log('FK -> usuarios:', fk.rows);

  // Check existing data for these users in any referenced table
  const related = await c.query(
    "SELECT 'clinicas' as tbl, u.cpf FROM usuarios u JOIN clinicas cl ON cl.usuario_id = u.id WHERE u.cpf IN ('11111111111','22222222222') UNION ALL SELECT 'entidades' as tbl, u.cpf FROM usuarios u JOIN entidades e ON e.usuario_id = u.id WHERE u.cpf IN ('11111111111','22222222222')"
  ).catch(() => ({ rows: [] }));
  console.log('FK data for these users:', related.rows);

  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
