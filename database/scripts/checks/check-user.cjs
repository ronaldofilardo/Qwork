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
    const res = await client.query(
      'SELECT cpf, tipo_usuario, clinica_id, entidade_id FROM usuarios WHERE cpf = $1',
      ['11144477735']
    );
    console.log('Usuario 11144477735:', res.rows[0]);
  } finally {
    await client.end();
  }
})();
