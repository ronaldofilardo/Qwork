import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Verificando cada funcionário individualmente\n");

    const funcionarios = [
      "10203040506", // Adriana Lopes
      "55555555555", // Ana Costa
      "45645645645", // Ana Costa
      "17171717171", // Bruno Cardoso
      "80510620949", // João da Lagos
    ];

    for (const cpf of funcionarios) {
      console.log(`\n👤 Verificando ${cpf}:`);

      // Verificar se existe avaliações
      const existeAvaliacoes = await pool.query(
        `
        SELECT COUNT(*) as total FROM avaliacoes WHERE funcionario_cpf = $1
      `,
        [cpf]
      );

      // Verificar se existe avaliações concluídas
      const existeConcluidas = await pool.query(
        `
        SELECT COUNT(*) as total FROM avaliacoes WHERE funcionario_cpf = $1 AND status = 'concluida'
      `,
        [cpf]
      );

      // Verificar todas as avaliações
      const todasAvaliacoes = await pool.query(
        `
        SELECT id, status FROM avaliacoes WHERE funcionario_cpf = $1 ORDER BY id
      `,
        [cpf]
      );

      console.log(`   📋 Total avaliações: ${existeAvaliacoes.rows[0].total}`);
      console.log(`   ✅ Concluídas: ${existeConcluidas.rows[0].total}`);
      console.log(
        `   📝 Detalhes: ${todasAvaliacoes.rows
          .map((a) => `${a.id}:${a.status}`)
          .join(", ")}`
      );

      const temAvaliacoes = existeAvaliacoes.rows[0].total > 0;
      const temConcluidas = existeConcluidas.rows[0].total > 0;

      console.log(
        `   🎯 Atende condição: EXISTS(avaliacoes)=${temAvaliacoes} AND NOT EXISTS(concluida)=${!temConcluidas} = ${
          temAvaliacoes && !temConcluidas
        }`
      );
    }

    console.log("\n🔍 Testando a subquery EXISTS diretamente:\n");

    for (const cpf of funcionarios) {
      const result = await pool.query(
        `
        SELECT
          $1 as cpf,
          CASE WHEN EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = $1) THEN 'SIM' ELSE 'NAO' END as tem_avaliacoes,
          CASE WHEN EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = $1 AND status = 'concluida') THEN 'SIM' ELSE 'NAO' END as tem_concluidas
      `,
        [cpf]
      );

      const row = result.rows[0];
      console.log(
        `${cpf}: EXISTS(avaliacoes)=${row.tem_avaliacoes}, EXISTS(concluida)=${row.tem_concluidas}`
      );
    }
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
})();
