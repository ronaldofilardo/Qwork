const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function checkFullState() {
  const client = new Client(process.env.LOCAL_DATABASE_URL);
  try {
    await client.connect();

    console.log('=== ESTADO ATUAL COMPLETO ===');

    // Verificar todos os enums
    const allEnums = await client.query(`
      SELECT t.typname as enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      GROUP BY t.typname
      ORDER BY t.typname
    `);

    console.log('Enums existentes:');
    allEnums.rows.forEach((row) => {
      console.log(`  ${row.enum_name}: (${row.values})`);
    });

    // Verificar colunas que usam enums
    const enumColumns = await client.query(`
      SELECT table_name, column_name, udt_name
      FROM information_schema.columns
      WHERE data_type = 'USER-DEFINED' AND table_schema = 'public'
      ORDER BY table_name, column_name
    `);

    console.log('\nColunas usando enums:');
    enumColumns.rows.forEach((col) => {
      console.log(`  ${col.table_name}.${col.column_name}: ${col.udt_name}`);
    });

    // Verificar dados atuais
    const contratantes = await client.query(`
      SELECT id, plano_tipo::text as plano_tipo
      FROM contratantes
      WHERE plano_tipo IS NOT NULL
    `);

    console.log('\nDados em contratantes:');
    contratantes.rows.forEach((c) => {
      console.log(`  ID ${c.id}: plano_tipo = ${c.plano_tipo}`);
    });

    await client.end();
  } catch (error) {
    console.error('Erro:', error.message);
    await client.end();
  }
}

checkFullState();
