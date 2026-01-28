const { Client } = require('pg');
require('dotenv').config({ path: '.env.test' });

const client = new Client(process.env.TEST_DATABASE_URL);

(async () => {
  try {
    await client.connect();
    console.log('Conectado ao banco de teste');

    // Verificar enum
    const enumResult = await client.query(
      'SELECT unnest(enum_range(NULL::status_aprovacao_enum)) as status'
    );
    console.log(
      'Status válidos:',
      enumResult.rows.map((r) => r.status)
    );

    // Verificar planos
    const planosResult = await client.query(
      'SELECT id, tipo FROM planos ORDER BY id'
    );
    console.log('Planos disponíveis:', planosResult.rows);

    // Verificar contratantes existentes
    const contratantesResult = await client.query(
      'SELECT cnpj, status, ativa FROM contratantes LIMIT 5'
    );
    console.log('Contratantes existentes:', contratantesResult.rows);

    await client.end();
  } catch (e) {
    console.error('Erro:', e);
    await client.end();
  }
})();
