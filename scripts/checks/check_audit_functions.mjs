import { Pool } from "pg";

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/check_audit_functions in test/CI environment to avoid touching development DBs."
  );
  process.exit(0);
}

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "nr-bps_db_test",
  user: "postgres",
  password: "123456",
});

async function checkAuditFunctions() {
  try {
    const result = await pool.query(`
      SELECT proname, pg_get_function_identity_arguments(oid) as args
      FROM pg_proc
      WHERE proname LIKE '%audit%'
      ORDER BY proname;
    `);
    console.log("Funções de auditoria:");
    result.rows.forEach((row) => {
      console.log(`${row.proname}(${row.args})`);
    });

    if (result.rows.length === 0) {
      console.log("Nenhuma função de auditoria encontrada!");
    }
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

checkAuditFunctions();
