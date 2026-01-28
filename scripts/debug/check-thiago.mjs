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
      SELECT cpf, nome, ultimo_lote_codigo, ultima_avaliacao_status, ultima_avaliacao_data_conclusao, data_ultimo_lote, indice_avaliacao
      FROM funcionarios
      WHERE nome ILIKE '%thiago%'
    `);

    console.log('Encontrados:', res.rowCount);
    console.table(
      res.rows.map((r) => ({
        cpf: r.cpf,
        nome: r.nome,
        ultimo_lote_codigo: r.ultimo_lote_codigo,
        ultima_avaliacao_status: r.ultima_avaliacao_status,
        ultima_avaliacao_data_conclusao:
          r.ultima_avaliacao_data_conclusao &&
          r.ultima_avaliacao_data_conclusao.toISOString(),
        data_ultimo_lote:
          r.data_ultimo_lote && r.data_ultimo_lote.toISOString(),
        indice_avaliacao: r.indice_avaliacao,
      }))
    );

    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
