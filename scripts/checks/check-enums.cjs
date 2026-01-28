const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function checkEnumsAndPlans() {
  const client = new Client(process.env.LOCAL_DATABASE_URL);
  try {
    await client.connect();
    console.log('=== PLANOS DISPONÍVEIS ===');
    const planos = await client.query(
      'SELECT id, nome, tipo FROM planos ORDER BY id'
    );
    planos.rows.forEach((p) =>
      console.log(`ID ${p.id}: ${p.nome} (${p.tipo})`)
    );

    console.log('\n=== ENUMS NO BANCO ===');
    const enums = await client.query(`
      SELECT t.typname as enum_name, e.enumlabel as value
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname IN ('tipo_plano', 'tipo_plano_enum')
      ORDER BY t.typname, e.enumsortorder
    `);

    const grouped = {};
    enums.rows.forEach((row) => {
      if (!grouped[row.enum_name]) grouped[row.enum_name] = [];
      grouped[row.enum_name].push(row.value);
    });

    Object.keys(grouped).forEach((enumName) => {
      console.log(`${enumName}: (${grouped[enumName].join(', ')})`);
    });

    await client.end();
  } catch (error) {
    console.error('Erro:', error.message);
    await client.end();
  }
}

checkEnumsAndPlans();
