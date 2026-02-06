require('../load-env.cjs').loadEnv();
const { query } = require('../../lib/db');

(async () => {
  try {
    const f = await query(
      'SELECT id, cpf, nome, perfil, contratante_id, clinica_id, ativo, senha_hash FROM funcionarios WHERE cpf = $1',
      ['70495096040']
    );
    console.log('\nBy CPF:', f.rows);
    const g = await query(
      'SELECT id, cpf, nome, perfil, contratante_id, clinica_id FROM funcionarios WHERE contratante_id = $1',
      [3]
    );
    console.log('\nBy contratante:', g.rows);
    const cl = await query(
      'SELECT id, nome, contratante_id FROM clinicas WHERE contratante_id = $1',
      [3]
    );
    console.log('\nClinica:', cl.rows);

    const s = await query('SELECT cpf FROM entidades_senhas WHERE cpf = $1', [
      '70495096040',
    ]);
    console.log('\nentidades_senhas rows:', s.rows);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
