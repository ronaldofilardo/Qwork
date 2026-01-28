import { Pool } from "pg";

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/check_trigger_status in test/CI environment to avoid touching development DBs."
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

async function checkTriggerStatus() {
  try {
    const result = await pool.query(`
      SELECT
        t.tgname as trigger_name,
        c.relname as table_name,
        p.proname as function_name,
        t.tgenabled as enabled,
        t.tgtype as trigger_type
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE c.relname = 'funcionarios'
      AND t.tgname = 'audit_funcionarios_trigger';
    `);
    console.log("Status do trigger:");
    result.rows.forEach((row) => {
      console.log(`Nome: ${row.trigger_name}`);
      console.log(`Tabela: ${row.table_name}`);
      console.log(`Função: ${row.function_name}`);
      console.log(`Habilitado: ${row.enabled}`);
      console.log(`Tipo: ${row.trigger_type}`);
    });

    if (result.rows.length === 0) {
      console.log("Trigger não encontrado!");
    }
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

checkTriggerStatus();
