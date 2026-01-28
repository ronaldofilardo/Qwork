import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Verificando avaliações com lote_id = null\n");

    // Contar avaliações com lote_id null
    const nullCount = await pool.query(`
      SELECT COUNT(*) as total
      FROM avaliacoes
      WHERE lote_id IS NULL
    `);

    console.log(
      `📊 Total de avaliações com lote_id = null: ${nullCount.rows[0].total}`
    );

    if (parseInt(nullCount.rows[0].total) > 0) {
      // Detalhes das avaliações com lote_id null
      const detalhes = await pool.query(`
        SELECT a.id, a.funcionario_cpf, a.status, a.inicio, a.envio, f.nome
        FROM avaliacoes a
        JOIN funcionarios f ON a.funcionario_cpf = f.cpf
        WHERE a.lote_id IS NULL
        ORDER BY a.id
      `);

      console.log("\n📝 Detalhes das avaliações órfãs:");
      detalhes.rows.forEach((row) => {
        console.log(
          `   ID: ${row.id} - ${row.nome} (${row.funcionario_cpf}) - Status: ${row.status}`
        );
        console.log(
          `      Início: ${
            row.inicio?.toISOString().split("T")[0] || "N/A"
          }, Envio: ${row.envio?.toISOString().split("T")[0] || "N/A"}`
        );
      });

      // Contar resultados dessas avaliações
      const resCount = await pool.query(`
        SELECT COUNT(*) as total
        FROM resultados
        WHERE avaliacao_id IN (
          SELECT id FROM avaliacoes WHERE lote_id IS NULL
        )
      `);

      console.log(
        `\n📊 Resultados dessas avaliações órfãs: ${resCount.rows[0].total}`
      );

      // Verificar se essas avaliações têm resultados
      const avalComResultados = await pool.query(`
        SELECT a.id, a.funcionario_cpf, f.nome, COUNT(r.id) as num_resultados
        FROM avaliacoes a
        JOIN funcionarios f ON a.funcionario_cpf = f.cpf
        LEFT JOIN resultados r ON a.id = r.avaliacao_id
        WHERE a.lote_id IS NULL
        GROUP BY a.id, a.funcionario_cpf, f.nome
        ORDER BY a.id
      `);

      console.log("\n📊 Avaliações órfãs com contagem de resultados:");
      avalComResultados.rows.forEach((row) => {
        console.log(
          `   ${row.nome} (${row.funcionario_cpf}) - Avaliação ID: ${row.id} - ${row.num_resultados} resultados`
        );
      });

      console.log(
        "\n⚠️  Essas são avaliações de testes anteriores que não estão associadas a lotes."
      );
      console.log(
        "Elas podem estar causando confusão na análise dos funcionários."
      );
    }
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
})();
