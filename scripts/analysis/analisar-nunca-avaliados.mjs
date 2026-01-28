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
      "🔍 Analisando funcionários que nunca concluíram avaliações..."
    );

    const result = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        f.indice_avaliacao,
        f.criado_em,
        COUNT(a.id) as total_avaliacoes_liberadas,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas
      FROM funcionarios f
      LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
      WHERE f.empresa_id = 1 AND f.ativo = true
      GROUP BY f.cpf, f.nome, f.indice_avaliacao, f.criado_em
      HAVING COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) = 0
      ORDER BY f.criado_em DESC
      LIMIT 10
    `);

    console.log("Funcionários que nunca concluíram avaliações:");
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.nome} (${row.cpf})`);
      console.log(`   - Índice atual: ${row.indice_avaliacao}`);
      console.log(
        `   - Avaliações liberadas: ${row.total_avaliacoes_liberadas}`
      );
      console.log(`   - Concluídas: ${row.avaliacoes_concluidas}`);
      console.log(`   - Inativadas: ${row.avaliacoes_inativadas}`);
      console.log(
        `   - Criado em: ${row.criado_em?.toISOString().split("T")[0]}`
      );
      console.log("");
    });
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await pool.end();
  }
})();
