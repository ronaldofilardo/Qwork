const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  password: '123456',
  host: 'localhost',
  port: 5432,
  database: process.env.TEST_DATABASE_URL?.split('/').pop() || 'nr-bps_db_test',
});

(async function () {
  try {
    await client.connect();

    // Verificar em clinicas_senhas
    const cRes = await client.query(
      'SELECT clinica_id, cpf FROM clinicas_senhas WHERE cpf = $1',
      ['11144477735']
    );
    console.log(
      'Em clinicas_senhas:',
      cRes.rows.length > 0 ? cRes.rows : 'NENHUM'
    );

    // Verificar em entidades_senhas
    const eRes = await client.query(
      'SELECT entidade_id, cpf FROM entidades_senhas WHERE cpf = $1',
      ['11144477735']
    );
    console.log(
      'Em entidades_senhas:',
      eRes.rows.length > 0 ? eRes.rows : 'NENHUM'
    );
  } finally {
    await client.end();
  }
})();
