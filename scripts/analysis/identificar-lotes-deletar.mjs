import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Identificando lotes a serem deletados\n");

    // Ver todos os lotes
    const lotes = await pool.query(`
      SELECT id, numero_ordem, codigo, liberado_em, titulo
      FROM lotes_avaliacao
      WHERE empresa_id = 1
      ORDER BY numero_ordem
    `);

    console.log("📋 Todos os lotes existentes:");
    lotes.rows.forEach((lote) => {
      console.log(
        `   Lote ${lote.numero_ordem} (${lote.codigo}) - ID: ${
          lote.id
        } - Liberado: ${lote.liberado_em?.toISOString().split("T")[0]}`
      );
    });

    // Identificar lotes a manter (001, 002, 003 de 17/12/2025)
    const lotesManter = lotes.rows.filter(
      (lote) =>
        lote.numero_ordem >= 1 &&
        lote.numero_ordem <= 3 &&
        lote.liberado_em?.toISOString().startsWith("2025-12-17")
    );

    console.log("\n✅ Lotes a MANTER:");
    lotesManter.forEach((lote) => {
      console.log(
        `   Lote ${lote.numero_ordem} (${lote.codigo}) - ID: ${lote.id}`
      );
    });

    // Lotes a deletar (todos os outros)
    const lotesDeletar = lotes.rows.filter(
      (lote) =>
        !(
          lote.numero_ordem >= 1 &&
          lote.numero_ordem <= 3 &&
          lote.liberado_em?.toISOString().startsWith("2025-12-17")
        )
    );

    console.log("\n❌ Lotes a DELETAR:");
    lotesDeletar.forEach((lote) => {
      console.log(
        `   Lote ${lote.numero_ordem} (${lote.codigo}) - ID: ${lote.id}`
      );
    });

    if (lotesDeletar.length === 0) {
      console.log("\n⚠️  Nenhum lote a deletar encontrado.");
      return;
    }

    // Contar avaliações e resultados a serem deletados
    let totalAvaliacoes = 0;
    let totalResultados = 0;

    for (const lote of lotesDeletar) {
      const avalCount = await pool.query(
        "SELECT COUNT(*) as total FROM avaliacoes WHERE lote_id = $1",
        [lote.id]
      );
      totalAvaliacoes += parseInt(avalCount.rows[0].total);

      // Contar resultados através das avaliações
      const resCount = await pool.query(
        `
        SELECT COUNT(*) as total
        FROM resultados r
        JOIN avaliacoes a ON r.avaliacao_id = a.id
        WHERE a.lote_id = $1
      `,
        [lote.id]
      );
      totalResultados += parseInt(resCount.rows[0].total);

      console.log(
        `   Lote ${lote.numero_ordem}: ${avalCount.rows[0].total} avaliações, ${resCount.rows[0].total} resultados`
      );
    }

    console.log(`\n📊 TOTAL A DELETAR:`);
    console.log(`   ${lotesDeletar.length} lotes`);
    console.log(`   ${totalAvaliacoes} avaliações`);
    console.log(`   ${totalResultados} resultados`);

    // Perguntar confirmação
    console.log(
      "\n⚠️  ATENÇÃO: Esta operação irá deletar permanentemente os dados!"
    );
    console.log(
      "Para confirmar, execute o script de limpeza: node limpar-lotes-antigos.mjs --confirm"
    );
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
})();
