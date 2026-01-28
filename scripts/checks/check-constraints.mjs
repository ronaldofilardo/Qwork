import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.test" });

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/check-constraints in test/CI environment to avoid touching development DBs."
  );
  process.exit(0);
}

const { Client } = pg;

const client = new Client({
  connectionString: process.env.TEST_DATABASE_URL,
});

async function checkConstraints() {
  try {
    await client.connect();
    console.log("Conectado ao banco");

    const result = await client.query(`
      SELECT conname, pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conrelid = 'funcionarios'::regclass;
    `);

    console.log("Restrições de perfil:");
    result.rows.forEach((row) => {
      console.log(`${row.conname}: ${row.pg_get_constraintdef}`);
    });
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await client.end();
  }
}

checkConstraints();
