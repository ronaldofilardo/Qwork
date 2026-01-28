require('dotenv').config({ path: '.env.local' });
const { query } = require('../../lib/db');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const cpf = '70495096040';
    const cs = await query(
      'SELECT senha_hash, contratante_id FROM contratantes_senhas WHERE cpf = $1',
      [cpf]
    );
    console.log('contratantes_senhas:', cs.rows);

    const f = await query(
      'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
      [cpf]
    );
    console.log('funcionarios:', f.rows);

    let cnpj = null;
    if (cs.rows[0] && cs.rows[0].contratante_id) {
      const c = await query('SELECT cnpj FROM contratantes WHERE id = $1', [
        cs.rows[0].contratante_id,
      ]);
      cnpj = c.rows[0]?.cnpj;
    } else {
      const c = await query(
        'SELECT cnpj FROM contratantes c JOIN funcionarios f ON f.contratante_id = c.id WHERE f.cpf = $1 LIMIT 1',
        [cpf]
      );
      cnpj = c.rows[0]?.cnpj;
    }

    console.log('cnpj found:', cnpj);
    const digits = (cnpj || '').replace(/\D/g, '');
    const pass = digits.slice(-6);
    console.log('computed pass:', pass);

    if (cs.rows[0]) {
      const ok = await bcrypt.compare(pass, cs.rows[0].senha_hash);
      console.log('bcrypt compare pass with contratantes_senhas:', ok);
    }

    if (f.rows[0]) {
      const ok2 = await bcrypt.compare(pass, f.rows[0].senha_hash);
      console.log('bcrypt compare pass with funcionarios:', ok2);
    }
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
