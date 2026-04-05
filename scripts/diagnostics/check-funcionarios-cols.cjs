#!/usr/bin/env node
require('dotenv').config({ path: '.env.test' });
const { Client } = require('pg');

(async () => {
  const c = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await c.connect();
    const res = await c.query(
      "SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name='funcionarios' ORDER BY column_name"
    );
    console.log('Colunas em funcionarios:');
    res.rows.forEach((row) => {
      console.log(
        `  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`
      );
    });
  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await c.end();
  }
})();
