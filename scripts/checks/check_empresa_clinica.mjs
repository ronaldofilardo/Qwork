import { Pool } from "pg";

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/check_empresa_clinica in test/CI environment to avoid touching development DBs."
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

async function checkEmpresaClinica() {
  try {
    const result = await pool.query(`
      SELECT id, nome, clinica_id FROM empresas_clientes WHERE id = 1;
    `);
    if (result.rows.length > 0) {
      const row = result.rows[0];
      console.log(
        `Empresa ID: ${row.id}, Nome: ${row.nome}, Clínica ID: ${row.clinica_id}`
      );
    } else {
      console.log("Empresa 1 não encontrada.");
    }
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

checkEmpresaClinica();
