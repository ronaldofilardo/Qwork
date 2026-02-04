const { Pool } = require('pg');
const connectionString =
  process.env.LOCAL_DATABASE_URL ||
  'postgresql://postgres:123456@localhost:5432/nr-bps_db';
const pool = new Pool({ connectionString });
(async () => {
  try {
    const res = await pool.query(
      "select la.id as lote_id, la.contratante_id, la.empresa_id, l.id as laudo_id, l.status, l.enviado_em from lotes_avaliacao la left join laudos l on l.id = la.id where la.id = 1" -- FIXME: Alterar ID conforme necessário
    );
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Erro query:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
