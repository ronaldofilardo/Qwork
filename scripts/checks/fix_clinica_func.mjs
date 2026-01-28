import { Pool } from "pg";

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/fix_clinica_func in test/CI environment to avoid touching development DBs."
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

async function fixClinicaFuncionarios() {
  try {
    const result = await pool.query(`
      UPDATE funcionarios
      SET clinica_id = ec.clinica_id
      FROM empresas_clientes ec
      WHERE funcionarios.empresa_id = ec.id
      AND (funcionarios.clinica_id IS NULL OR funcionarios.clinica_id != ec.clinica_id)
      RETURNING funcionarios.id, funcionarios.nome, funcionarios.clinica_id, ec.clinica_id as nova_clinica;
    `);
    console.log(`Corrigidos ${result.rowCount} funcionários:`);
    result.rows.forEach((row) => {
      console.log(
        `ID: ${row.id}, Nome: ${row.nome}, Clinica antiga: ${row.clinica_id}, Nova: ${row.nova_clinica}`
      );
    });
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

fixClinicaFuncionarios();
