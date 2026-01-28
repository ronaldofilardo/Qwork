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
      "🔍 Verificando se há dados de avaliações/resultados de lotes antigos\n"
    );

    // IDs dos lotes a manter
    const lotesManterIds = [27, 31, 32]; // IDs dos lotes 001, 002, 003

    // Verificar avaliações que não pertencem aos lotes atuais
    const avalFora = await pool.query(
      `
      SELECT COUNT(*) as total
      FROM avaliacoes
      WHERE lote_id NOT IN ($1, $2, $3)
    `,
      lotesManterIds
    );

    console.log(
      `📊 Avaliações fora dos lotes atuais: ${avalFora.rows[0].total}`
    );

    // Verificar resultados que não pertencem aos lotes atuais
    const resFora = await pool.query(
      `
      SELECT COUNT(*) as total
      FROM resultados r
      JOIN avaliacoes a ON r.avaliacao_id = a.id
      WHERE a.lote_id NOT IN ($1, $2, $3)
    `,
      lotesManterIds
    );

    console.log(
      `📊 Resultados fora dos lotes atuais: ${resFora.rows[0].total}`
    );

    if (
      parseInt(avalFora.rows[0].total) > 0 ||
      parseInt(resFora.rows[0].total) > 0
    ) {
      console.log("\n⚠️  Há dados órfãos de lotes antigos!");

      // Mostrar detalhes
      const avalDetalhes = await pool.query(
        `
        SELECT a.id, a.funcionario_cpf, a.lote_id, a.status, f.nome
        FROM avaliacoes a
        JOIN funcionarios f ON a.funcionario_cpf = f.cpf
        WHERE a.lote_id NOT IN ($1, $2, $3)
        LIMIT 10
      `,
        lotesManterIds
      );

      if (avalDetalhes.rows.length > 0) {
        console.log("\n📝 Avaliações órfãs:");
        avalDetalhes.rows.forEach((row) => {
          console.log(
            `   ${row.nome} (${row.funcionario_cpf}) - Lote ID: ${row.lote_id}, Status: ${row.status}`
          );
        });
      }
    } else {
      console.log(
        "\n✅ Não há dados órfãos. Todos os dados estão associados aos 3 lotes atuais."
      );
    }

    // Verificar se há lotes que foram deletados mas deixaram dados para trás
    const lotesDeletados = await pool.query(`
      SELECT DISTINCT a.lote_id
      FROM avaliacoes a
      LEFT JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE la.id IS NULL
    `);

    if (lotesDeletados.rows.length > 0) {
      console.log(
        "\n⚠️  Há avaliações referenciando lotes que não existem mais:"
      );
      lotesDeletados.rows.forEach((row) => {
        console.log(`   Lote ID: ${row.lote_id}`);
      });
    }
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
})();
