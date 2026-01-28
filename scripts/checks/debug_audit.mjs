import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "nr-bps_db_test",
  user: "postgres",
  password: "123456",
});

async function debugAuditFunction() {
  try {
    // Testar se conseguimos chamar a função diretamente
    console.log("Testando função de auditoria...");

    const result = await pool.query(`
      SELECT audit_trigger_function() as result;
    `);

    console.log("Resultado:", result.rows[0]);
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

debugAuditFunction();
