import pg from "pg";

const { Client } = pg;

// Conectar ao banco (local ou produção baseado no env)
const client = new Client({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:123456@localhost:5432/nr-bps_db",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function listUsers() {
  try {
    await client.connect();
    console.log("Conectado ao banco local");

    const result = await client.query(`
      SELECT cpf, nome, perfil, clinica_id, empresa_id, nivel_cargo
      FROM funcionarios
      ORDER BY perfil, cpf
    `);

    console.log("\nUsuários no banco local:");
    result.rows.forEach((user) => {
      console.log(
        `${user.cpf} - ${user.nome} (${user.perfil}) - Clinica: ${user.clinica_id} - Empresa: ${user.empresa_id} - Nivel: ${user.nivel_cargo}`
      );
    });
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await client.end();
  }
}

listUsers();
