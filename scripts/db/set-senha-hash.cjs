const { query } = require('../../lib/db');
(async () => {
  try {
    const hash = process.argv[2];
    const cpf = process.argv[3];
    if (!hash || !cpf) {
      console.error('Uso: node set-senha-hash.cjs <hash> <cpf>');
      process.exit(1);
    }

    const res = await query(
      'UPDATE funcionarios SET senha_hash = $1 WHERE cpf = $2 RETURNING cpf, length(senha_hash) as len',
      [hash, cpf]
    );
    console.log('Resultado:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(2);
  }
})();
