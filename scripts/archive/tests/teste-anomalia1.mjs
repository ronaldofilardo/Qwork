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
      "🔍 Testando query da anomalia 1 (NUNCA_AVALIADO) isoladamente...\n"
    );

    const anomalia1 = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        f.setor,
        f.indice_avaliacao,
        f.data_ultimo_lote,
        CASE
          WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
          ELSE EXTRACT(DAY FROM NOW() - f.criado_em)::INTEGER
        END AS dias_desde_ultima_avaliacao,
        'ALTA'::VARCHAR(20) AS prioridade,
        'NUNCA_AVALIADO'::VARCHAR(50) AS categoria_anomalia,
        CASE
          WHEN EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf) THEN
            'Funcionário teve ' || (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = f.cpf) || ' avaliações liberadas mas nunca concluiu nenhuma. Todas foram inativadas.'
          ELSE
            'Funcionário ativo há ' || ROUND(EXTRACT(DAY FROM NOW() - f.criado_em) / 30.0, 1) || ' meses sem realizar primeira avaliação.'
        END AS mensagem
      FROM funcionarios f
      WHERE
        f.empresa_id = 1
        AND f.ativo = true
        AND (
          -- Nunca teve avaliações liberadas E foi criado há mais de 6 meses
          (f.criado_em < NOW() - INTERVAL '6 months' AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf))
          OR
          -- Teve avaliações liberadas mas nunca concluiu nenhuma
          (EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf) AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'concluida'))
        )
    `);

    console.log(`Anomalia 1 retornou ${anomalia1.rows.length} registros:`);
    anomalia1.rows.forEach((row) => {
      console.log(
        `  - ${row.nome} (${row.cpf}): ${
          row.categoria_anomalia
        } - ${row.mensagem.substring(0, 50)}...`
      );
    });

    // Verificar se João está na query
    const joao = anomalia1.rows.find((row) => row.cpf === "80510620949");
    if (joao) {
      console.log("\n✅ João da Lagos encontrado na anomalia 1!");
    } else {
      console.log("\n❌ João da Lagos NÃO encontrado na anomalia 1!");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await pool.end();
  }
})();
