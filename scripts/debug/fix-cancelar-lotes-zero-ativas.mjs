import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.development' });
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log('Buscando lotes com ativas = 0 e status != cancelado...');
    const res = await pool.query(`
      SELECT la.id, la.codigo, la.status,
        COUNT(a.id) FILTER (WHERE a.status != 'inativada') as ativas
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON a.lote_id = la.id
      GROUP BY la.id
      HAVING COUNT(a.id) FILTER (WHERE a.status != 'inativada') = 0
        AND la.status != 'cancelado'
    `);

    console.log('Encontrados', res.rowCount, 'lote(s)');
    for (const row of res.rows) {
      console.log(
        'Processando lote:',
        row.id,
        row.codigo,
        'status atual:',
        row.status
      );
      // Atualizar diretamente para 'cancelado' (one-off sync)
      try {
        const upd = await pool.query(
          `UPDATE lotes_avaliacao SET status = 'cancelado', atualizado_em = NOW() WHERE id = $1 RETURNING id, status`,
          [row.id]
        );
        console.log('Atualizado:', upd.rows[0]);
      } catch (err) {
        console.error('Erro ao atualizar lote', row.id, err);
      }
    }

    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
