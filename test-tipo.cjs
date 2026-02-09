const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  password: '123456',
  host: 'localhost',
  port: 5432,
  database: 'nr-bps_db',
});

(async function () {
  try {
    await client.connect();

    // Check in usuarios
    const uRes = await client.query(
      'SELECT cpf, tipo_usuario, clinica_id, entidade_id FROM usuarios WHERE cpf = $1',
      ['11144477735']
    );
    console.log('em usuarios:', uRes.rows);

    // Check in funcionarios
    const fRes = await client.query(
      'SELECT cpf, tipo_usuario, clinica_id, entidade_id FROM funcionarios WHERE cpf = $1',
      ['11144477735']
    );
    console.log('em funcionarios:', fRes.rows);
  } finally {
    await client.end();
  }
})();
