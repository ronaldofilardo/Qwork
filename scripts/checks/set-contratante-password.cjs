require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { query } = require('../../lib/db');

(async () => {
  try {
    const hash = await bcrypt.hash('test1234', 10);
    const res = await query(
      'UPDATE contratantes_senhas SET senha_hash = $1 WHERE cpf = $2 RETURNING cpf',
      [hash, '70495096040']
    );
    console.log('Updated rows:', res.rows);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
