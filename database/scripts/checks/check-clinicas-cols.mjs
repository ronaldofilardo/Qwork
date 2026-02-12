import { query } from './lib/db.ts';

try {
  const res = await query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'clinicas' ORDER BY column_name`,
    []
  );
  console.log('Colunas da tabela clinicas:');
  console.log(res.rows.map((r) => r.column_name).join(', '));
  process.exit(0);
} catch (err) {
  console.error('Erro:', err.message);
  process.exit(1);
}
