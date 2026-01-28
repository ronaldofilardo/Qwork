import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.test" });

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/check-users in test/CI environment to avoid touching development DBs."
  );
  process.exit(0);
}

const { Client } = pg;

const client = new Client({
  connectionString: process.env.TEST_DATABASE_URL,
});

async function checkUsers() {
  try {
    await client.connect();
    console.log("Conectado ao banco de teste");

    const result = await client.query(`
      SELECT cpf, nome, perfil
      FROM funcionarios
      ORDER BY perfil, cpf
    `);

    console.log("\nUsuários no banco de teste:");
    result.rows.forEach((user) => {
      console.log(`${user.cpf} - ${user.nome} (${user.perfil})`);
    });
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await client.end();
  }
}

checkUsers();
