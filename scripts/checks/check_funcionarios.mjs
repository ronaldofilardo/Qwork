import { Pool } from "pg";

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/check_funcionarios in test/CI environment to avoid touching development DBs."
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

async function checkFuncionarios() {
  try {
    const result = await pool.query(`
      SELECT f.id, f.nome, ec.id as empresa_id, ec.clinica_id
      FROM funcionarios f
      JOIN empresas_clientes ec ON f.empresa_id = ec.id
      WHERE ec.id = 1 AND ec.clinica_id != 1;
    `);
    if (result.rows.length === 0) {
      console.log("Nenhum funcionário da empresa 1 não pertence à clínica 1.");
    } else {
      console.log("Funcionários encontrados que não pertencem à clínica 1:");
      result.rows.forEach((row) => {
        console.log(
          `ID: ${row.id}, Nome: ${row.nome}, Empresa: ${row.empresa_id}, Clínica: ${row.clinica_id}`
        );
      });
    }
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

checkFuncionarios();
