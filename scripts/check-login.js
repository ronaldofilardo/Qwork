import bcrypt from 'bcryptjs';
import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

(async () => {
  await client.connect();
  const res = await client.query(
    'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
    ['04703084945']
  );
  console.log('rows', res.rows);
  const hash = res.rows[0]?.senha_hash;
  const ok = await bcrypt.compare('000170', hash);
  console.log('bcrypt compare result:', ok);
  await client.end();
})();
