import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log("🔍 Testando apenas anomalia 2 (mais de 1 ano)...\n");

    const anomalia2 = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        f.setor,
        f.indice_avaliacao,
        f.data_ultimo_lote,
        EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER AS dias_desde_ultima_avaliacao,
        'ALTA'::VARCHAR(20) AS prioridade,
        'MAIS_DE_1_ANO_SEM_AVALIACAO'::VARCHAR(50) AS categoria_anomalia,
        'Funcionário está há ' || ROUND(EXTRACT(DAY FROM NOW() - f.data_ultimo_lote) / 365.0, 1) || ' anos sem avaliação válida.' AS mensagem
      FROM funcionarios f
      WHERE
        f.empresa_id = 1
        AND f.ativo = true
        AND f.data_ultimo_lote IS NOT NULL
        AND f.data_ultimo_lote < NOW() - INTERVAL '1 year'
        AND f.data_ultimo_lote >= NOW() - INTERVAL '2 years'
    `);

    console.log(`Anomalia 2 retornou ${anomalia2.rows.length} registros:`);
    anomalia2.rows.forEach((row) => {
      console.log(`  - ${row.nome} (${row.cpf}): ${row.categoria_anomalia}`);
    });

    // Verificar data_ultimo_lote de João
    const joaoData = await pool.query(`
      SELECT cpf, nome, data_ultimo_lote FROM funcionarios WHERE cpf = '80510620949'
    `);

    if (joaoData.rows.length > 0) {
      console.log(
        `\nJoão data_ultimo_lote: ${joaoData.rows[0].data_ultimo_lote}`
      );
      console.log(
        `João nunca concluiu avaliação, então data_ultimo_lote deve ser NULL`
      );
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
