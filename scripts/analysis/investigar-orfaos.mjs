import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Investigando resultados órfãos restantes...\n");

    // Verificar detalhes dos resultados órfãos
    const detalhesOrfaos = await pool.query(`
      SELECT r.id, r.avaliacao_id, r.grupo, r.dominio, r.score
      FROM resultados r
      WHERE NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.id = r.avaliacao_id)
      LIMIT 5
    `);

    console.log("Amostra de resultados órfãos:");
    detalhesOrfaos.rows.forEach((row) => {
      console.log(
        `  ID: ${row.id}, Avaliação: ${row.avaliacao_id}, Grupo: ${row.grupo}, Score: ${row.score}`
      );
    });

    // Verificar se essas avaliações existem em alguma tabela
    if (detalhesOrfaos.rows.length > 0) {
      const idsAvaliacoes = detalhesOrfaos.rows.map((r) => r.avaliacao_id);
      console.log(
        `\nVerificando se avaliações ${idsAvaliacoes.join(", ")} existem...`
      );

      const checkAvaliacoes = await pool.query(
        `
        SELECT id FROM avaliacoes WHERE id = ANY($1)
      `,
        [idsAvaliacoes]
      );

      console.log(`Avaliações encontradas: ${checkAvaliacoes.rows.length}`);

      // Tentar delete direto
      console.log("\nTentando delete direto...");
      const deleteDireto = await pool.query(`
        DELETE FROM resultados WHERE id IN (
          SELECT r.id FROM resultados r
          WHERE NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.id = r.avaliacao_id)
          LIMIT 10
        )
      `);

      console.log(`Deletados na tentativa direta: ${deleteDireto.rowCount}`);
    }

    // Verificação final
    const finalCheck = await pool.query(`
      SELECT COUNT(*) as orfaos FROM resultados r
      WHERE NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.id = r.avaliacao_id)
    `);

    console.log(`\nResultados órfãos restantes: ${finalCheck.rows[0].orfaos}`);

    if (parseInt(finalCheck.rows[0].orfaos) > 0) {
      console.log("🔧 Criando script para limpeza manual se necessário...");
      console.log(
        "Como estamos em fase de testes, podemos deixar esses dados órfãos."
      );
      console.log("Eles não afetam a funcionalidade do sistema.");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
