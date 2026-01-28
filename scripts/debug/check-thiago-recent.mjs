import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.development' });
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});
(async () => {
  try {
    const res = await pool.query(`
      SELECT cpf, COALESCE(data_ultimo_lote, ultima_avaliacao_data_conclusao) as ultima_valida,
             COALESCE(data_ultimo_lote, ultima_avaliacao_data_conclusao) >= NOW() - INTERVAL '1 year' as tem_avaliacao_recente
      FROM funcionarios
      WHERE nome ILIKE '%thiago%'
    `);
    console.log(res.rows);
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
