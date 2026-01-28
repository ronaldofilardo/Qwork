import { Pool } from "pg";

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/test_audit_manual in test/CI environment to avoid touching development DBs."
  );
  process.exit(0);
}

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "nr-bps_db",
  user: "postgres",
  password: "123456",
});

async function checkLotes() {
  const client = await pool.connect();

  try {
    console.log("Verificando se há lotes no banco...");

    const countResult = await client.query(
      `SELECT COUNT(*) as total FROM lotes_avaliacao`
    );
    console.log(`Total de lotes: ${countResult.rows[0].total}`);

    if (parseInt(countResult.rows[0].total) === 0) {
      console.log(
        "Nenhum lote encontrado. Verificando se o banco está populado..."
      );
      return;
    }

    const result = await client.query(`
      SELECT
        la.id, la.codigo, la.titulo,
        COUNT(CASE WHEN a.status != 'inativada' THEN 1 END) as total_ativas,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as inativadas,
        l.id as laudo_id, l.status as status_laudo, l.emissor_cpf,
        l.criado_em, l.emitido_em, l.enviado_em
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      LEFT JOIN laudos l ON la.id = l.lote_id
      GROUP BY la.id, la.codigo, la.titulo, l.id, l.status, l.emissor_cpf, l.criado_em, l.emitido_em, l.enviado_em
      ORDER BY la.id DESC
      LIMIT 5
    `);

    console.log("Resultado da análise dos lotes 006 e 007:");
    console.table(result.rows);
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkLotes();
