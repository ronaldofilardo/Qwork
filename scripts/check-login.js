import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new pg.Client({
  connectionString: process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL,
});

(async () => {
  const cpf = process.argv[2];
  const senha = process.argv[3];

  if (!cpf || !senha) {
    console.error('Uso: node check-login.js <CPF> <Senha>');
    process.exit(1);
  }

  await client.connect();
  const res = await client.query(
    'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
    [cpf]
  );
  console.log('rows', res.rows);
  const hash = res.rows[0]?.senha_hash;
  const ok = await bcrypt.compare(senha, hash);
  console.log('bcrypt compare result:', ok);
  await client.end();
})();
