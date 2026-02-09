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

    // Update usuarios to reflect RH type
    const res = await client.query(
      'UPDATE usuarios SET tipo_usuario = $1, clinica_id = $2, entidade_id = NULL WHERE cpf = $3 RETURNING *',
      ['rh', 6, '11144477735']
    );

    console.log('Updated usuarios:', res.rows[0]);
  } finally {
    await client.end();
  }
})();
