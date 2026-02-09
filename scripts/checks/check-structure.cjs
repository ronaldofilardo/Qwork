const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function checkTableStructure() {
  const client = new Client(process.env.LOCAL_DATABASE_URL);
  try {
    await client.connect();

    console.log('=== ESTRUTURA DA TABELA tomadores ===');

    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tomadores'
      ORDER BY ordinal_position
    `);

    columns.rows.forEach((col) => {
      console.log(
        `${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : ''}`
      );
    });

    console.log('\n=== DADOS DE tomadores ===');
    const tomadores = await client.query(`
      SELECT id, plano_tipo
      FROM tomadores
      WHERE plano_tipo IS NOT NULL
      ORDER BY id
    `);

    console.log('tomadores com plano_tipo definido:');
    tomadores.rows.forEach((c) => {
      console.log(`ID ${c.id}: plano_tipo = ${c.plano_tipo}`);
    });

    if (tomadores.rows.length === 0) {
      console.log('Nenhum contratante tem plano_tipo definido.');
    }

    await client.end();
  } catch (error) {
    console.error('Erro:', error.message);
    await client.end();
  }
}

checkTableStructure();
