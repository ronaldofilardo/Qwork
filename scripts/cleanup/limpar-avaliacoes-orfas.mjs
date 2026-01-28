import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log(
      "🗑️  Deletando avaliações órfãs (lote_id = null) e seus resultados...\n"
    );

    // Primeiro, deletar os resultados das avaliações órfãs
    const deleteResultados = await pool.query(`
      DELETE FROM resultados
      WHERE avaliacao_id IN (
        SELECT id FROM avaliacoes WHERE lote_id IS NULL
      )
    `);

    console.log(
      `✅ Deletados ${deleteResultados.rowCount} resultados de avaliações órfãs`
    );

    // Depois, deletar as avaliações órfãs
    const deleteAvaliacoes = await pool.query(`
      DELETE FROM avaliacoes WHERE lote_id IS NULL
    `);

    console.log(`✅ Deletadas ${deleteAvaliacoes.rowCount} avaliações órfãs`);

    // Verificar se sobrou alguma coisa
    const restantes = await pool.query(`
      SELECT COUNT(*) as total FROM avaliacoes WHERE lote_id IS NULL
    `);

    console.log(
      `\n📊 Verificação final: ${restantes.rows[0].total} avaliações órfãs restantes`
    );

    if (parseInt(restantes.rows[0].total) === 0) {
      console.log("✅ Todas as avaliações órfãs foram deletadas com sucesso!");
    } else {
      console.log("⚠️  Ainda há avaliações órfãs restantes");
    }

    // Verificar o impacto na análise dos funcionários
    console.log("\n🔍 Verificando impacto na análise dos funcionários...\n");

    const analise = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as inativadas
      FROM funcionarios f
      LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
      WHERE f.empresa_id = 1 AND f.ativo = true
      GROUP BY f.cpf, f.nome
      ORDER BY f.nome
    `);

    console.log("📊 Análise atualizada dos funcionários:");
    analise.rows.forEach((row) => {
      const nuncaAvaliou = row.total_avaliacoes > 0 && row.concluidas === 0;
      const status = nuncaAvaliou
        ? "NUNCA AVALIOU"
        : row.concluidas > 0
        ? "JÁ AVALIOU"
        : "SEM AVALIAÇÕES";
      console.log(
        `${row.nome} (${row.cpf}): ${row.total_avaliacoes} aval, ${row.concluidas} conc, ${row.inativadas} inat - ${status}`
      );
    });
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
