import { Pool } from "pg";

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/count_funcionarios in test/CI environment to avoid touching development DBs."
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

async function countFuncionarios() {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as total FROM funcionarios WHERE empresa_id = 1;
    `);
    console.log(
      `Total de funcionários cadastrados na empresa 1: ${result.rows[0].total}`
    );
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

countFuncionarios();
