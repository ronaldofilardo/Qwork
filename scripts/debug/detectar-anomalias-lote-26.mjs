import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.development' });
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});
(async () => {
  try {
    const loteId = 26;
    const empresaRes = await pool.query(
      `SELECT COALESCE(empresa_id,0) as empresa_id FROM lotes_avaliacao WHERE id=$1`,
      [loteId]
    );
    const empresaId = empresaRes.rows[0].empresa_id || 0;
    if (!empresaId) {
      console.log('Lote sem empresa associada ou empresa_id=0');
      await pool.end();
      return;
    }
    const anom = await pool.query(
      `SELECT * FROM detectar_anomalias_indice($1)`,
      [empresaId]
    );
    console.log('Total anomalias for empresa', empresaId, ':', anom.rowCount);
    // Join with avaliacoes to restrict to lote
    if (anom.rowCount > 0) {
      const cpfs = anom.rows.map((r) => r.funcionario_cpf);
      const clima = await pool.query(
        `SELECT a.id, a.funcionario_cpf, f.nome, a.lote_id FROM avaliacoes a JOIN funcionarios f ON a.funcionario_cpf=f.cpf WHERE a.funcionario_cpf = ANY($1::char(11)[]) AND a.lote_id = $2`,
        [cpfs, loteId]
      );
      console.table(
        clima.rows.map((r) => ({
          id: r.id,
          cpf: r.funcionario_cpf,
          nome: r.nome,
          lote_id: r.lote_id,
        }))
      );
    }
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
