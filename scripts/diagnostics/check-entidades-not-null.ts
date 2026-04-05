#!/usr/bin/env tsx
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

(async () => {
  const r = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name='entidades' AND is_nullable='NO' 
    ORDER BY ordinal_position
  `);

  console.log('CAMPOS OBRIGATÓRIOS (NOT NULL) DA TABELA ENTIDADES:\n');
  r.rows.forEach((c) => {
    console.log(
      `  ${c.column_name.padEnd(30)} ${c.data_type.padEnd(25)} ${c.column_default || ''}`
    );
  });

  // Pegar uma entidade existente como exemplo
  console.log('\n\nEXEMPLO DE ENTIDADE EXISTENTE (ID 35):\n');
  const exemplo = await pool.query('SELECT * FROM entidades WHERE id = 35');

  if (exemplo.rows[0]) {
    Object.entries(exemplo.rows[0]).forEach(([key, value]) => {
      console.log(`  ${key.padEnd(30)} ${value}`);
    });
  }

  await pool.end();
})();
