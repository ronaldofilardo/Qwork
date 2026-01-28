const { Client } = require('pg');
const bcrypt = require('bcryptjs');

(async () => {
  const client = new Client({
    connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
  });
  try {
    await client.connect();
    const cpf = '87545772920';
    const plain = '000184';
    const hash = await bcrypt.hash(plain, 10);
    console.log('Gerado hash:', hash.substring(0, 30) + '...');
    const upd = await client.query(
      'UPDATE funcionarios SET senha_hash = $1, atualizado_em = NOW() WHERE cpf = $2 RETURNING cpf, length(senha_hash) as len, substr(senha_hash,1,40) as preview',
      [hash, cpf]
    );
    console.log('Resultado update:', upd.rows);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
