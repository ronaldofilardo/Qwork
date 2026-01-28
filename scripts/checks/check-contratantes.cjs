const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function checkContratantes() {
  const client = new Client(process.env.LOCAL_DATABASE_URL);
  try {
    await client.connect();

    console.log('=== VERIFICANDO CONTRATANTES EXISTENTES ===');

    // Verificar valores de plano_tipo em contratantes
    const contratantes = await client.query(`
      SELECT id, razao_social, plano_tipo
      FROM contratantes
      WHERE plano_tipo IS NOT NULL
      ORDER BY id
    `);

    console.log('Contratantes com plano_tipo definido:');
    contratantes.rows.forEach((c) => {
      console.log(`ID ${c.id}: ${c.razao_social} (${c.plano_tipo})`);
    });

    if (contratantes.rows.length === 0) {
      console.log('Nenhum contratante tem plano_tipo definido.');
    }

    await client.end();
  } catch (error) {
    console.error('Erro:', error.message);
    await client.end();
  }
}

checkContratantes();
