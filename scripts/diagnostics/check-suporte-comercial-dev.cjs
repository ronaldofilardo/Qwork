'use strict';
const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
  });
  await client.connect();

  // 1. Usuários na tabela usuarios
  const u = await client.query(
    "SELECT id, cpf, nome, email, tipo_usuario, ativo FROM usuarios WHERE cpf IN ('11111111111','22222222222')"
  );
  console.log('=== usuarios ===');
  console.log(JSON.stringify(u.rows, null, 2));

  // 2. Tabelas com "role", "permiss", "acesso"
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name ILIKE '%role%' OR table_name ILIKE '%permiss%' OR table_name ILIKE '%acesso%') ORDER BY table_name"
  );
  console.log('=== role/permiss/acesso tables ===');
  console.log(tables.rows.map((r) => r.table_name));

  // 3. Colunas da tabela usuarios
  const cols = await client.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='usuarios' ORDER BY ordinal_position"
  );
  console.log('=== usuarios columns ===');
  console.log(cols.rows.map((r) => `${r.column_name} (${r.data_type})`));

  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
