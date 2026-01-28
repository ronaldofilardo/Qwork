import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Verificando empresa de João da Lagos...\n");

    const joao = await pool.query(`
      SELECT f.cpf, f.nome, f.empresa_id, ec.nome as empresa_nome
      FROM funcionarios f
      JOIN empresas_clientes ec ON f.empresa_id = ec.id
      WHERE f.cpf = '80510620949'
    `);

    if (joao.rows.length > 0) {
      console.log(
        `João da Lagos: empresa_id = ${joao.rows[0].empresa_id}, empresa = ${joao.rows[0].empresa_nome}`
      );
    } else {
      console.log("❌ João da Lagos não encontrado!");
    }

    // Verificar se há funcionários na empresa 1
    const funcionariosEmpresa1 = await pool.query(`
      SELECT COUNT(*) as total FROM funcionarios WHERE empresa_id = 1 AND ativo = true
    `);

    console.log(
      `\n📊 Total de funcionários ativos na empresa 1: ${funcionariosEmpresa1.rows[0].total}`
    );

    // Verificar se João está ativo
    const joaoAtivo = await pool.query(`
      SELECT ativo FROM funcionarios WHERE cpf = '80510620949'
    `);

    if (joaoAtivo.rows.length > 0) {
      console.log(`João da Lagos está ativo: ${joaoAtivo.rows[0].ativo}`);
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
