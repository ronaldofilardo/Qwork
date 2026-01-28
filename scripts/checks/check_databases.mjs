import { Pool } from "pg";

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/check_databases in test/CI environment to avoid touching development DBs."
  );
  process.exit(0);
}

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "123456",
});

async function checkDatabases() {
  try {
    const result = await pool.query(`
      SELECT datname FROM pg_database
      WHERE datistemplate = false
      ORDER BY datname;
    `);
    console.log("Bancos de dados disponíveis:");
    result.rows.forEach((row) => {
      console.log(`- ${row.datname}`);
    });
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

checkDatabases();
