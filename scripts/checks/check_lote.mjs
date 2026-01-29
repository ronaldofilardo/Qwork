import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.development" });

async function checkLote() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
  });

  try {
    const res = await pool.query(`
      SELECT la.id, la.codigo, la.empresa_id, la.status, l.status as laudo_status
      FROM lotes_avaliacao la
      LEFT JOIN laudos l ON la.id = l.id
      WHERE la.codigo = '004-161225'
    `);
    console.log("Lote details:", res.rows);
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkLote();
