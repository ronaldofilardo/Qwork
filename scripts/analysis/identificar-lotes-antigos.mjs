import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Identificando lotes anteriores aos 3 lotes atuais...\n");

    // Primeiro, verificar todos os lotes existentes
    const todosLotes = await pool.query(`
      SELECT id, numero_ordem, liberado_em, criado_em, empresa_id
      FROM lotes_avaliacao
      ORDER BY numero_ordem ASC
    `);

    console.log("📋 Todos os lotes existentes:");
    todosLotes.rows.forEach((lote) => {
      console.log(
        `  Lote ${lote.numero_ordem}: ID=${lote.id}, liberado=${lote.liberado_em}, empresa=${lote.empresa_id}`
      );
    });

    // Identificar os 3 lotes atuais (001-171225, 002-171225, 003-171225)
    const lotesAtuais = todosLotes.rows.filter(
      (lote) => lote.numero_ordem >= 1 && lote.numero_ordem <= 3
    );

    console.log("\n✅ Lotes atuais (a manter):");
    lotesAtuais.forEach((lote) => {
      console.log(`  Lote ${lote.numero_ordem}: ID=${lote.id}`);
    });

    // Identificar lotes anteriores (numero_ordem > 3)
    const lotesAnteriores = todosLotes.rows.filter(
      (lote) => lote.numero_ordem > 3
    );

    console.log("\n❌ Lotes anteriores (a deletar):");
    if (lotesAnteriores.length === 0) {
      console.log("  Nenhum lote anterior encontrado.");
      return;
    }

    lotesAnteriores.forEach((lote) => {
      console.log(`  Lote ${lote.numero_ordem}: ID=${lote.id}`);
    });

    // Contar avaliações e resultados associados aos lotes anteriores
    const idsLotesAnteriores = lotesAnteriores.map((l) => l.id);

    if (idsLotesAnteriores.length > 0) {
      const avaliacoesAnteriores = await pool.query(
        `
        SELECT COUNT(*) as total_avaliacoes
        FROM avaliacoes
        WHERE lote_id = ANY($1)
      `,
        [idsLotesAnteriores]
      );

      const resultadosAnteriores = await pool.query(
        `
        SELECT COUNT(*) as total_resultados
        FROM resultados
        WHERE avaliacao_id IN (
          SELECT id FROM avaliacoes WHERE lote_id = ANY($1)
        )
      `,
        [idsLotesAnteriores]
      );

      console.log(`\n📊 Dados a serem deletados:`);
      console.log(`  - ${lotesAnteriores.length} lotes`);
      console.log(
        `  - ${avaliacoesAnteriores.rows[0].total_avaliacoes} avaliações`
      );
      console.log(
        `  - ${resultadosAnteriores.rows[0].total_resultados} resultados`
      );

      // Perguntar confirmação
      console.log(
        "\n⚠️  ATENÇÃO: Esta operação irá deletar dados permanentemente!"
      );
      console.log(
        "Como estamos em fase de testes, vou prosseguir com a limpeza."
      );
      console.log("Para produção, seria necessário backup prévio.\n");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
