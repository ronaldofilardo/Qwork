const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function analyzePlansStructure() {
  const client = new Client(process.env.LOCAL_DATABASE_URL);
  try {
    await client.connect();

    // Verificar colunas da tabela planos
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'planos'
      ORDER BY ordinal_position
    `);

    console.log('=== COLUNAS DA TABELA PLANOS ===');
    columns.rows.forEach((col) => {
      console.log(`${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });

    console.log('\n=== DADOS DOS PLANOS ===');
    const planos = await client.query('SELECT * FROM planos ORDER BY id');
    planos.rows.forEach((p) => {
      console.log(`ID ${p.id}: ${p.nome} (tipo: ${p.tipo})`);
    });

    console.log('\n=== CAMPOS PLANO NA TABELA CONTRATANTES ===');
    const contratantesCols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'contratantes'
      AND column_name LIKE '%plano%'
      ORDER BY column_name
    `);

    contratantesCols.rows.forEach((col) => {
      console.log(
        `  ${col.column_name}: ${col.data_type} (${col.is_nullable})`
      );
    });

    await client.end();
  } catch (error) {
    console.error('Erro:', error.message);
    await client.end();
  }
}

analyzePlansStructure();
