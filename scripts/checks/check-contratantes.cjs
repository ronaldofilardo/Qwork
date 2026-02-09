const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function checktomadores() {
  const client = new Client(process.env.LOCAL_DATABASE_URL);
  try {
    await client.connect();

    console.log('=== VERIFICANDO tomadores EXISTENTES ===');

    // Verificar valores de plano_tipo em tomadores
    const tomadores = await client.query(`
      SELECT id, razao_social, plano_tipo
      FROM tomadores
      WHERE plano_tipo IS NOT NULL
      ORDER BY id
    `);

    console.log('tomadores com plano_tipo definido:');
    tomadores.rows.forEach((c) => {
      console.log(`ID ${c.id}: ${c.razao_social} (${c.plano_tipo})`);
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

checktomadores();
