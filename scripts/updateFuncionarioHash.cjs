const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

(async () => {
  const client = new Client({
    connectionString:
      process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    const cpf = process.argv[2];
    const plain = process.argv[3];

    if (!cpf || !plain) {
      console.error('Uso: node updateFuncionarioHash.cjs <CPF> <Senha>');
      process.exit(1);
    }
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
