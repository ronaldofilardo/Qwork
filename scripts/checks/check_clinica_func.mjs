import { Pool } from "pg";

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/check_clinica_func in test/CI environment to avoid touching development DBs."
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

async function checkClinicaFuncionarios() {
  try {
    const result = await pool.query(`
      SELECT f.id, f.nome, f.clinica_id, ec.clinica_id as empresa_clinica
      FROM funcionarios f
      JOIN empresas_clientes ec ON f.empresa_id = ec.id
      WHERE ec.id = 1 AND (f.clinica_id IS NULL OR f.clinica_id != ec.clinica_id)
      LIMIT 10;
    `);
    console.log("Funcionários com clinica_id inconsistente:");
    result.rows.forEach((row) => {
      console.log(
        `ID: ${row.id}, Nome: ${row.nome}, Clinica Func: ${row.clinica_id}, Clinica Empresa: ${row.empresa_clinica}`
      );
    });
    if (result.rows.length === 0) {
      console.log("Nenhum inconsistente encontrado.");
    }
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

checkClinicaFuncionarios();
