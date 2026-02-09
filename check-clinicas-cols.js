const { query } = require('./lib/db');

query(
  `SELECT column_name FROM information_schema.columns WHERE table_name = 'clinicas' ORDER BY column_name`,
  []
)
  .then((res) => {
    console.log('Colunas da tabela clinicas:');
    console.log(res.rows.map((r) => r.column_name).join(', '));
    process.exit(0);
  })
  .catch((err) => {
    console.error('Erro:', err.message);
    process.exit(1);
  });
