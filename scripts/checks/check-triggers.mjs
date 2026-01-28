import { Client } from "pg";

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/check-triggers in test/CI environment to avoid touching development DBs."
  );
  process.exit(0);
}

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "nr-bps_db",
  user: "postgres",
  password: "postgres",
});

async function checkTriggers() {
  try {
    await client.connect();

    const triggers = await client.query(`
      SELECT tgname, tgrelid::regclass as table_name
      FROM pg_trigger
      WHERE tgname LIKE '%rh%'
    `);

    console.log("Triggers relacionados a RH:");
    triggers.rows.forEach((t) =>
      console.log(`  ${t.tgname} on ${t.table_name}`)
    );

    // Verificar índices únicos
    const indexes = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE indexname LIKE '%rh%' OR indexname LIKE '%unique%'
    `);

    console.log("\nÍndices únicos relacionados:");
    indexes.rows.forEach((i) =>
      console.log(`  ${i.indexname} on ${i.tablename}`)
    );
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await client.end();
  }
}

checkTriggers();
