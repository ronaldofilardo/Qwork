import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🗑️  Deletando avaliações órfãs não concluídas primeiro...\n");

    // Primeiro, deletar avaliações órfãs que não estão concluídas
    const deleteNaoConcluidas = await pool.query(`
      DELETE FROM avaliacoes
      WHERE lote_id IS NULL AND status != 'concluida'
    `);

    console.log(
      `✅ Deletadas ${deleteNaoConcluidas.rowCount} avaliações órfãs não concluídas`
    );

    // Verificar quantas avaliações concluídas órfãs restaram
    const concluidasRestantes = await pool.query(`
      SELECT COUNT(*) as total FROM avaliacoes WHERE lote_id IS NULL AND status = 'concluida'
    `);

    console.log(
      `📊 Avaliações concluídas órfãs restantes: ${concluidasRestantes.rows[0].total}`
    );

    if (parseInt(concluidasRestantes.rows[0].total) > 0) {
      console.log(
        "\n⚠️  Há avaliações concluídas órfãs que não podem ser deletadas devido ao trigger de imutabilidade."
      );
      console.log(
        "Para removê-las completamente, seria necessário desabilitar o trigger temporariamente."
      );
      console.log(
        "Como essas são avaliações de teste, vamos deixar como estão por enquanto."
      );
    }

    // Verificar o impacto na análise
    console.log("\n🔍 Análise atualizada após limpeza parcial:\n");

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

    console.log("📊 Status atual dos funcionários:");
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

    // Contar quantos funcionários nunca avaliaram
    const nuncaAvaliaram = analise.rows.filter(
      (row) => row.total_avaliacoes > 0 && row.concluidas === 0
    ).length;
    console.log(
      `\n📊 Total de funcionários que nunca concluíram avaliações: ${nuncaAvaliaram}`
    );
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
