import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "bps_test",
  user: "postgres",
  password: "postgres",
});

async function checkTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'audit_logs'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    console.log("Colunas da tabela audit_logs:");
    result.rows.forEach((row) => {
      console.log(`${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

checkTable();
