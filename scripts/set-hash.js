import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new pg.Client({
  connectionString: process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL,
});

(async () => {
  const cpf = process.argv[2];
  const senha = process.argv[3];
  const contratanteId = process.argv[4];

  if (!cpf || !senha) {
    console.error('Uso: node set-hash.js <CPF> <Senha> [ContratanteID]');
    process.exit(1);
  }

  await client.connect();
  const hash = await bcrypt.hash(senha, 10);

  if (contratanteId) {
    await client.query(
      'UPDATE contratantes_senhas SET senha_hash = $1 WHERE contratante_id = $2 AND cpf = $3',
      [hash, contratanteId, cpf]
    );
  }

  await client.query('UPDATE funcionarios SET senha_hash = $1 WHERE cpf = $2', [
    hash,
    cpf,
  ]);
  console.log('Hash atualizado');
  await client.end();
})();
