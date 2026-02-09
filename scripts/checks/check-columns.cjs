const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function checkColumns() {
  const client = new Client(process.env.LOCAL_DATABASE_URL);
  try {
    await client.connect();

    console.log('=== VERIFICANDO ESTRUTURA DAS COLUNAS ===');

    // Verificar estrutura da tabela tomadores
    const tomadores = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'tomadores' AND column_name = 'plano_tipo'
    `);

    console.log('Coluna plano_tipo em tomadores:', tomadores.rows[0]);

    // Verificar estrutura da tabela planos
    const planos = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'planos' AND column_name = 'tipo'
    `);

    console.log('Coluna tipo em planos:', planos.rows[0]);

    await client.end();
  } catch (error) {
    console.error('Erro:', error.message);
    await client.end();
  }
}

checkColumns();
