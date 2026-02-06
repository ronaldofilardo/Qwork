/* insert-test-emissor.cjs
   Insere um emissor de teste diretamente na tabela usuarios do DB local
*/
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

(async () => {
  const conn = process.env.LOCAL_DATABASE_URL;
  if (!conn) {
    console.error('LOCAL_DATABASE_URL not set');
    process.exit(1);
  }
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    const cpf = '53051173991';
    const nome = 'Emissor Teste';
    const email = 'emissor.teste@example.com';
    const senhaHash = await bcrypt.hash('123456', 10);

    const res = await client.query(
      `INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
       VALUES ($1, $2, $3, 'emissor', $4, true, NOW(), NOW())
       ON CONFLICT (cpf) DO UPDATE SET
         nome = EXCLUDED.nome,
         email = EXCLUDED.email,
         tipo_usuario = EXCLUDED.tipo_usuario,
         senha_hash = EXCLUDED.senha_hash,
         ativo = EXCLUDED.ativo,
         atualizado_em = CURRENT_TIMESTAMP
       RETURNING cpf, nome, email`,
      [cpf, nome, email, senhaHash]
    );

    console.log('Inserido/Atualizado:', res.rows[0]);
  } catch (e) {
    console.error('Erro:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
