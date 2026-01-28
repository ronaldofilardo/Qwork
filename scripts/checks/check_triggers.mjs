import { Pool } from "pg";

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/check_triggers in test/CI environment to avoid touching development DBs."
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

async function checkTriggers() {
  try {
    const result = await pool.query(`
      SELECT
        t.tgname as trigger_name,
        c.relname as table_name,
        p.proname as function_name,
        t.tgenabled as enabled
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE c.relname = 'funcionarios'
      ORDER BY t.tgname;
    `);
    console.log("Triggers na tabela funcionarios:");
    result.rows.forEach((row) => {
      console.log(
        `${row.trigger_name} -> ${row.function_name} (enabled: ${row.tgenabled})`
      );
    });
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

checkTriggers();
